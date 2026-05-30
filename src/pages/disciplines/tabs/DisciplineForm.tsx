import React, { useState, useEffect } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type {
  Discipline,
  DisciplineAudience,
  DisciplineTeacher,
  WeeklyOccurrence,
  RepeatType,
} from '../../../types';
import { DAYS } from '../../../constants/days';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTeachersAll } from '../../../store/slices/teachersListSlice';
import { fetchGroupsAll } from '../../../store/slices/groupsListSlice';
import type { Group } from '../../../types/group';
import { LESSON_TYPE_LABELS } from './RootDisciplineForm';
import type { AcademicDisciplineType } from '../../../api';
import { roomApi } from '../../../api';
import type { RoomTreeDto } from '../../../api';
import { clampToValidDate } from '../../../utils/validateDate';
import { isTimeRangeValid } from '../../../utils/validateTime';
import { SearchableSelect } from '../../../components/SearchableSelect/SearchableSelect';
import { GroupTreeSelect } from '../../../components/GroupTreeSelect/GroupTreeSelect';
import styles from './DisciplineForm.module.scss';
import {v4 as uuidv4} from "uuid";

interface RoomOption {
  id: string;
  label: string;
}

const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: 'every-week', label: 'Каждую неделю' },
  { value: 'once', label: 'Единожды' },
  { value: 'even-weeks', label: 'По чётным неделям' },
  { value: 'odd-weeks', label: 'По нечётным неделям' },
];

// ─── Batch state ──────────────────────────────────────────────────────────────

interface BatchForm {
  lessonId?: string;             // UUID урока (для обновления существующих batch-ей)
  totalHoursCount?: number;
  groupIds: string[];
  isStatic: boolean;
  canOverlap: boolean;
  repeat: RepeatType;
  weeklyCount: number | null;
  dateRange?: { from: string; to: string };
  occurrences: WeeklyOccurrence[];
  teachers: DisciplineTeacher[];
  audiences: DisciplineAudience[];
  comment?: string | null;
  collapsed: boolean;
}

function emptyBatch(): BatchForm {
  return {
    totalHoursCount: undefined,
    groupIds: [],
    isStatic: false,
    canOverlap: false,
    repeat: 'every-week',
    weeklyCount: 1,
    dateRange: undefined,
    occurrences: [],
    teachers: [],
    audiences: [],
    collapsed: false,
  };
}

function batchFromDiscipline(d: Discipline): BatchForm {
  return {
    lessonId: d.lessonId,
    totalHoursCount: d.totalHoursCount,
    groupIds: d.forIds ?? [],
    isStatic: d.isStatic,
    canOverlap: d.canOverlap,
    repeat: d.repeat ?? 'every-week',
    weeklyCount: d.weeklyCount ?? 1,
    dateRange: d.dateRange,
    occurrences: d.occurrences ?? [],
    teachers: d.teachers ?? [],
    audiences: d.audiences ?? [],
    comment: d.comment,
    collapsed: false,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initial?: Discipline;
  onSave: (d: Discipline) => void;
  onCancel?: () => void;
  loading?: boolean;
  /** Режим редактирования одного занятия (без кнопки «Добавить ещё») */
  singleBatch?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const DisciplineForm: React.FC<Props> = ({ initial, onSave, onCancel, loading, singleBatch }) => {
  const [parentId, setParentId] = useState(initial?.parentId ?? '');
  const [lessonType, setLessonType] = useState<AcademicDisciplineType | undefined>(initial?.lessonType);
  const [batches, setBatches] = useState<BatchForm[]>(() => {
    if (!initial) return [emptyBatch()];
    // Если есть _extraBatches (редактирование всего batch-а) — загружаем все
    const mainBatch = batchFromDiscipline(initial);
    const extras = (initial._extraBatches ?? []).map((extra) =>
      batchFromDiscipline({ ...initial, ...extra } as Discipline),
    );
    return [mainBatch, ...extras];
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const dispatch = useAppDispatch();
  const { teachers: teachersList } = useAppSelector((s) => s.teachersList);
  const { groups, streams } = useAppSelector((s) => s.groupsList);
  const { rootDisciplines: allDisciplines } = useAppSelector((s) => s.disciplinesList);
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);

  const rootDisciplines = allDisciplines.filter((d) => d.isRoot);
  const selectedRoot = rootDisciplines.find((d) => d.id === parentId) ?? null;
  const availableLessonTypes: AcademicDisciplineType[] = selectedRoot?.allowedLessonTypes ?? [];

  // Потоки с подсказкой о входящих группах
  const streamOptions = streams.map((s) => ({
    id: s.id,
    label: s.name,
    childGroupNames: groups
      .filter((g) => g.streamIds?.includes(s.id))
      .map((g) => g.name),
  }));

  // Только сами группы (Group)
  const actualGroupOptions = groups.map((g) => ({ id: g.id, label: g.name }));

  // Только команды (SemiGroup) в формате «Группа / Команда»
  const semiGroupOptions = groups.flatMap((g) =>
    g.subgroups.map((sg) => ({ id: sg.id, label: `${g.name} / ${sg.name}` })),
  );

  // Общий плоский список для поиска подписей в заголовке копии
  const allGroupsFlat = [
    ...streamOptions.map((s) => ({ id: s.id, label: s.label })),
    ...actualGroupOptions,
    ...semiGroupOptions,
  ];

  useEffect(() => {
    if (teachersList.length === 0) dispatch(fetchTeachersAll());
    dispatch(fetchGroupsAll());
    roomApi.getRoomTree().then(({ data }) => {
      const opts: RoomOption[] = [];
      for (const campus of data as RoomTreeDto[]) {
        for (const room of campus.childRooms) {
          opts.push({ id: room.id, label: `${campus.campusName} — ${room.name}` });
        }
      }
      setRoomOptions(opts);
    }).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (lessonType && !availableLessonTypes.includes(lessonType)) {
      setLessonType(undefined);
    }
  }, [parentId]);

  // ─── Batch helpers ──────────────────────────────────────────────────────────

  const updateBatch = (index: number, patch: Partial<BatchForm>) => {
    setBatches((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const addBatch = () => {
    const last = batches[batches.length - 1];
    setBatches((prev) => [
      ...prev.map((c) => ({ ...c, collapsed: true })),
      { ...last, occurrences: last.occurrences.map((occ) => ({ ...occ, id: undefined })), lessonId: undefined, groupIds: [], collapsed: false },
    ]);
  };

  const removeBatch = (index: number) => {
    setBatches((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCollapse = (index: number) => {
    updateBatch(index, { collapsed: !batches[index].collapsed });
  };

  // ─── Per-batch handlers ─────────────────────────────────────────────────────

  const setWeeklyCount = (index: number, count: number | null) => {
    if (count === null) {
      setBatches((prev) =>
        prev.map((c, i) => i === index ? { ...c, weeklyCount: null } : c),
      );
      return;
    }
    const clamped = Math.max(1, Math.min(6, count));
    setBatches((prev) =>
      prev.map((c, i) =>
        i === index
          ? { ...c, weeklyCount: clamped, occurrences: c.occurrences.slice(0, clamped) }
          : c,
      ),
    );
  };

  const addOccurrence = (index: number) => {
    const batch = batches[index];
    if (batch.occurrences.length >= (batch.weeklyCount ?? 1)) return;
    updateBatch(index, {
      occurrences: [...batch.occurrences, { dayId: 'mon', timeStart: '09:00', timeEnd: '10:30' }],
    });
  };

  const removeOccurrence = (batchIndex: number, occIndex: number) => {
    updateBatch(batchIndex, {
      occurrences: batches[batchIndex].occurrences.filter((_, i) => i !== occIndex),
    });
  };

  const updateOccurrence = (
    batchIndex: number,
    occIndex: number,
    patch: Partial<WeeklyOccurrence>,
  ) => {
    updateBatch(batchIndex, {
      occurrences: batches[batchIndex].occurrences.map((o, i) =>
        i === occIndex ? { ...o, ...patch } : o,
      ),
    });
  };

  const addAudience = (batchIndex: number) => {
    updateBatch(batchIndex, {
      audiences: [...batches[batchIndex].audiences, { roomId: '', roomName: '' }],
    });
  };

  const removeAudience = (batchIndex: number, audIndex: number) => {
    updateBatch(batchIndex, {
      audiences: batches[batchIndex].audiences.filter((_, i) => i !== audIndex),
    });
  };

  const updateAudience = (batchIndex: number, audIndex: number, patch: Partial<DisciplineAudience>) => {
    updateBatch(batchIndex, {
      audiences: batches[batchIndex].audiences.map((a, i) => (i === audIndex ? { ...a, ...patch } : a)),
    });
  };

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!parentId) errs.parentId = 'Обязательное поле';
    if (!lessonType) errs.lessonType = 'Обязательное поле';
    batches.forEach((batch, idx) => {
      if (batch.groupIds.length === 0)
        errs[`group_${idx}`] = `Занятие ${idx + 1}: выберите хотя бы одну группу`;
      if (batch.isStatic && batch.occurrences.length === 0)
        errs[`occurrences_${idx}`] = `Занятие ${idx + 1}: укажите время`;
      if (batch.isStatic) {
        batch.occurrences.forEach((occ, oi) => {
          if (!isTimeRangeValid(occ.timeStart, occ.timeEnd))
            errs[`time_${idx}_${oi}`] = `Занятие ${idx + 1}, время ${oi + 1}: начало должно быть раньше окончания`;
        });
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Save ───────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!validate()) return;
    const typeLabel = lessonType ? LESSON_TYPE_LABELS[lessonType] : '';
    const generatedName = selectedRoot ? `${selectedRoot.name} (${typeLabel})` : typeLabel;
    const first = batches[0];

    // Первый batch — основной, остальные передаются как _extraBatches (транспортное поле)
    const extraBatches: Partial<Discipline>[] = batches.slice(1).map((c) => ({
      lessonId: c.lessonId,
      forIds: c.groupIds,
      teachers: c.teachers,
      audiences: c.audiences,
      roomIds: c.audiences.map((x) => x.roomId),
      occurrences: c.occurrences,
      repeat: c.repeat,
      canOverlap: c.canOverlap,
      totalHoursCount: c.totalHoursCount,
      dateRange: c.dateRange,
      weeklyCount: c.weeklyCount ?? 1,
      isStatic: c.isStatic,
      comment: c.comment,
    }));

    onSave({
      ...first,
      id: initial?.id ?? uuidv4(),
      lessonId: first.lessonId ?? initial?.lessonId,
      name: generatedName,
      parentId,
      lessonType,
      isRoot: false,
      forType: 'group',
      forIds: first.groupIds,
      semesterNumber: selectedRoot?.semesterNumber,
      allowedLessonTypes: undefined,
      roomIds: first.audiences.map((x) => x.roomId),
      _extraBatches: extraBatches.length > 0 ? extraBatches : undefined,
    } as Discipline);
  };

  const handleReset = () => {
    setParentId('');
    setLessonType(undefined);
    setBatches([emptyBatch()]);
    setErrors({});
    setShowResetConfirm(false);
  };

  // ─── Time helpers ────────────────────────────────────────────────────────────

  const handleTimeInput = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
  };

  const normalizeTime = (val: string): string => {
    if (!val || !val.includes(':')) return val;
    const [h, m] = val.split(':').map(Number);
    return `${String(Math.min(23, h || 0)).padStart(2, '0')}:${String(Math.min(59, m || 0)).padStart(2, '0')}`;
  };

  const handleDateInput = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 4) return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
    if (digits.length > 2) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    return digits;
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.form}>

      {/* ── Shared fields ── */}
      <FormField label="Корневая дисциплина" required error={errors.parentId}>
        <SearchableSelect
          options={rootDisciplines.map((d) => ({ value: d.id, label: d.name }))}
          value={parentId}
          onChange={setParentId}
          placeholder="— выберите дисциплину —"
          disabled={!!initial}
        />
        {rootDisciplines.length === 0 && (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            Сначала создайте корневую дисциплину на вкладке «Добавить корневую дисциплину»
          </span>
        )}
      </FormField>

      <FormField label="Вид занятия" required error={errors.lessonType}>
        <select
          className="field-input"
          value={lessonType ?? ''}
          onChange={(e) => setLessonType((e.target.value as AcademicDisciplineType) || undefined)}
          disabled={!!initial || availableLessonTypes.length === 0}
        >
          <option value="">— выберите тип —</option>
          {availableLessonTypes.map((t) => (
            <option key={t} value={t}>{LESSON_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </FormField>

      {/* ── Batches ── */}
      {batches.map((batch, idx) => {
          console.log(batches);
          return (
              <BatchSection
                  key={idx}
                  index={idx}
                  batch={batch}
                  total={batches.length}
                  errors={{
                    ...Object.fromEntries(
                      Object.entries(errors)
                        .filter(([k]) => k === 'parentId' || k === 'lessonType')
                    ),
                    ...Object.fromEntries(
                      Object.entries(errors)
                        .filter(([k]) => k === `group_${idx}` || k === `occurrences_${idx}`)
                        .map(([k, v]) => [k.replace(`_${idx}`, ''), v])
                    ),
                  }}
                  streamOptions={streamOptions}
                  actualGroupOptions={actualGroupOptions}
                  semiGroupOptions={semiGroupOptions}
                  allGroupsFlat={allGroupsFlat}
                  allGroupsFull={groups}
                  teachersList={teachersList}
                  roomOptions={roomOptions}
                  onUpdate={(patch) => updateBatch(idx, patch)}
                  onRemove={() => removeBatch(idx)}
                  onToggleCollapse={() => toggleCollapse(idx)}
                  onAddOccurrence={() => addOccurrence(idx)}
                  onRemoveOccurrence={(i) => removeOccurrence(idx, i)}
                  onUpdateOccurrence={(i, patch) => updateOccurrence(idx, i, patch)}
                  onAddAudience={() => addAudience(idx)}
                  onRemoveAudience={(i) => removeAudience(idx, i)}
                  onUpdateAudience={(i, patch) => updateAudience(idx, i, patch)}
                  handleTimeInput={handleTimeInput}
                  normalizeTime={normalizeTime}
                  handleDateInput={handleDateInput}
              />
          );
      })}

      {!singleBatch && (
        <button className={styles.addBtn} onClick={addBatch} type="button">
          + Добавить занятие
        </button>
      )}

      {/* ── Actions ── */}
      <div className={styles.actions}>
        {showResetConfirm ? (
          <div className={styles.resetConfirm}>
            <span>Сбросить все поля?</span>
            <Button size="sm" variant="danger" onClick={handleReset}>Да, сбросить</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowResetConfirm(false)}>Отмена</Button>
          </div>
        ) : (
          <>
            {onCancel ? (
              <Button variant="secondary" onClick={onCancel} disabled={loading}>Отмена</Button>
            ) : (
              <Button variant="secondary" onClick={() => setShowResetConfirm(true)} disabled={loading}>Сбросить</Button>
            )}
            <Button variant="primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── BatchSection ────────────────────────────────────────────────────────────

interface StreamOption {
  id: string;
  label: string;
  childGroupNames: string[];
}

interface GroupOption {
  id: string;
  label: string;
}

interface BatchSectionProps {
  index: number;
  batch: BatchForm;
  total: number;
  errors: Record<string, string>;
  streamOptions: StreamOption[];
  actualGroupOptions: GroupOption[];
  semiGroupOptions: GroupOption[];
  allGroupsFlat: GroupOption[];
  allGroupsFull: Group[];
  teachersList: { id: string; name: string }[];
  roomOptions: RoomOption[];
  onUpdate: (patch: Partial<BatchForm>) => void;
  onRemove: () => void;
  onToggleCollapse: () => void;
  onAddOccurrence: () => void;
  onRemoveOccurrence: (i: number) => void;
  onUpdateOccurrence: (i: number, patch: Partial<WeeklyOccurrence>) => void;
  onAddAudience: () => void;
  onRemoveAudience: (i: number) => void;
  onUpdateAudience: (i: number, patch: Partial<DisciplineAudience>) => void;
  handleTimeInput: (raw: string) => string;
  normalizeTime: (val: string) => string;
  handleDateInput: (raw: string) => string;
}

const BatchSection: React.FC<BatchSectionProps> = ({
  index,
  batch,
  total,
  errors,
  streamOptions,
  actualGroupOptions,
  semiGroupOptions,
  allGroupsFlat,
  allGroupsFull,
  teachersList,
  roomOptions,
  onUpdate,
  onRemove,
  onToggleCollapse,
  onAddOccurrence,
  onRemoveOccurrence,
  onUpdateOccurrence,
  onAddAudience,
  onRemoveAudience,
  onUpdateAudience,
  handleTimeInput,
  normalizeTime,
  handleDateInput,
}) => {
  const selectedGroupLabels = batch.groupIds
    .map((id) => allGroupsFlat.find((g) => g.id === id)?.label ?? id);
  const groupSummary = selectedGroupLabels.length === 0
    ? '— не выбраны —'
    : selectedGroupLabels.length <= 2
      ? selectedGroupLabels.join(', ')
      : `${selectedGroupLabels.slice(0, 2).join(', ')}…`;

  const effectiveWeeklyCount = batch.weeklyCount ?? 1;
  const canAddOccurrence = batch.occurrences.length < effectiveWeeklyCount;

  const toggleGroup = (id: string) => {
    const has = batch.groupIds.includes(id);
    onUpdate({ groupIds: has ? batch.groupIds.filter((g) => g !== id) : [...batch.groupIds, id] });
  };

  return (
    <div className={styles.batchSection}>
      {/* Accordion header */}
      <div className={styles.batchHeader}>
        <button
          type="button"
          className={styles.batchToggle}
          onClick={onToggleCollapse}
          title={batch.collapsed ? 'Развернуть' : 'Свернуть'}
        >
          <span className={styles.batchChevron}>{batch.collapsed ? '▶' : '▼'}</span>
          <span className={styles.batchGroupLabel}>
            {`Занятие ${index + 1}`}
            {': '}
            <strong>{groupSummary}</strong>
          </span>
        </button>
        {total > 1 && (
          <button type="button" className={styles.batchRemoveBtn} onClick={onRemove} title="Удалить занятие">
            ✕
          </button>
        )}
      </div>

      {/* Accordion body */}
      {!batch.collapsed && (
        <div className={styles.batchBody}>
          {/* Группы (иерархический мультиселект) */}
          <FormField label="Группы" required error={errors.group}>
            <GroupTreeSelect
              groups={allGroupsFull}
              streams={streamOptions.map((s) => ({
                id: s.id,
                name: s.label,
                groupIds: allGroupsFull.filter((g) => g.streamIds?.includes(s.id)).map((g) => g.id),
                disciplineIds: [],
              }))}
              selectedIds={batch.groupIds}
              onToggle={toggleGroup}
              onBulkSelect={(ids) => onUpdate({ groupIds: [...new Set([...batch.groupIds, ...ids])] })}
              onBulkDeselect={(ids) => onUpdate({ groupIds: batch.groupIds.filter((id) => !ids.includes(id)) })}
            />
          </FormField>

          {/* Количество часов */}
          <FormField label="Количество часов">
            <div className={styles.weeklyCountRow}>
              <input
                className="field-input"
                type="number"
                min={0}
                value={batch.totalHoursCount ?? ''}
                onChange={(e) => onUpdate({ totalHoursCount: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="36"
                style={{ width: 100 }}
              />
              <span className={styles.weeklyCountLabel}>ч.</span>
            </div>
          </FormField>

          {/* Тип + совмещение */}
          <div className={styles.row2}>
            {/* TODO: Тип дисциплины (isStatic) — ожидаем реализацию на бэке, пока всегда "Непостоянная" */}
            <FormField label="Тип дисциплины" required>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" checked={!batch.isStatic} onChange={() => onUpdate({ isStatic: false })} />
                  Непостоянная
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" checked={batch.isStatic} onChange={() => onUpdate({ isStatic: true })} />
                  Постоянная
                </label>
              </div>
            </FormField>

            <FormField label="Совмещение" required>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" checked={!batch.canOverlap} onChange={() => onUpdate({ canOverlap: false })} />
                  Обязательная
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" checked={batch.canOverlap} onChange={() => onUpdate({ canOverlap: true })} />
                  По выбору
                </label>
              </div>
            </FormField>
          </div>

          {/* Повторение + кол-во в неделю */}
          <div className={styles.row2}>
            <FormField label="Повторение" required>
              <select
                className="field-input"
                value={batch.repeat}
                onChange={(e) => onUpdate({ repeat: e.target.value as RepeatType })}
              >
                {REPEAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>

            {/* TODO: Кол-во раз в неделю — ожидаем реализацию на бэке, пока вычисляем из occurrences.length */}
            <FormField label="Кол-во раз в неделю" hint="от 1 до 6">
              <div className={styles.weeklyCountRow}>
                <input
                  className="field-input"
                  type="number"
                  min={1}
                  max={6}
                  value={batch.weeklyCount ?? ''}
                  placeholder="1"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      onUpdate({ weeklyCount: null });
                    } else {
                      const n = Math.min(6, parseInt(raw) || 1);
                      onUpdate({ weeklyCount: n, occurrences: batch.occurrences.slice(0, n) });
                    }
                  }}
                  onBlur={() => {
                    if (batch.weeklyCount == null || batch.weeklyCount < 1) {
                      onUpdate({ weeklyCount: 1, occurrences: batch.occurrences.slice(0, 1) });
                    }
                  }}
                  style={{ width: 72 }}
                />
                <span className={styles.weeklyCountLabel}>раз в неделю</span>
              </div>
            </FormField>
          </div>

          {/* Даты */}
          <div className={styles.row2}>
            <FormField label="Дата начала" hint="Если не указана — берётся из проекта расписания">
              <input
                className="field-input"
                value={batch.dateRange?.from ?? ''}
                onChange={(e) =>
                  onUpdate({ dateRange: { from: handleDateInput(e.target.value), to: batch.dateRange?.to ?? '' } })
                }
                onBlur={() => {
                  const clamped = clampToValidDate(batch.dateRange?.from ?? '', 'DD.MM.YYYY');
                  if (clamped !== (batch.dateRange?.from ?? ''))
                    onUpdate({ dateRange: { from: clamped, to: batch.dateRange?.to ?? '' } });
                }}
                placeholder="01.09.2025"
                maxLength={10}
              />
            </FormField>
            <FormField label="Дата окончания" hint="Если не указана — берётся из проекта расписания">
              <input
                className="field-input"
                value={batch.dateRange?.to ?? ''}
                onChange={(e) =>
                  onUpdate({ dateRange: { from: batch.dateRange?.from ?? '', to: handleDateInput(e.target.value) } })
                }
                onBlur={() => {
                  const clamped = clampToValidDate(batch.dateRange?.to ?? '', 'DD.MM.YYYY');
                  if (clamped !== (batch.dateRange?.to ?? ''))
                    onUpdate({ dateRange: { from: batch.dateRange?.from ?? '', to: clamped } });
                }}
                placeholder="31.12.2025"
                maxLength={10}
              />
            </FormField>
          </div>
          <FormField
            label="Время проведения"
            required={batch.isStatic}
            error={errors.occurrences}
            hint={effectiveWeeklyCount > 1 ? `Можно добавить до ${effectiveWeeklyCount} промежутков` : undefined}
          >
            <div className={styles.occurrences}>
              {batch.occurrences.map((occ, i) => (
                <div key={i} className={styles.occurrenceRow}>
                  <select
                    className={styles.daySelect}
                    value={occ.dayId}
                    onChange={(e) => onUpdateOccurrence(i, { dayId: e.target.value })}
                  >
                    {DAYS.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <input
                    className={styles.timeInput}
                    value={occ.timeStart}
                    onChange={(e) => onUpdateOccurrence(i, { timeStart: handleTimeInput(e.target.value) })}
                    onBlur={(e) => onUpdateOccurrence(i, { timeStart: normalizeTime(e.target.value) })}
                    placeholder="09:00"
                    maxLength={5}
                  />
                  <span className={styles.timeSep}>—</span>
                  <input
                    className={styles.timeInput}
                    value={occ.timeEnd}
                    onChange={(e) => onUpdateOccurrence(i, { timeEnd: handleTimeInput(e.target.value) })}
                    onBlur={(e) => onUpdateOccurrence(i, { timeEnd: normalizeTime(e.target.value) })}
                    placeholder="10:30"
                    maxLength={5}
                  />
                  <button className={styles.removeBtn} onClick={() => onRemoveOccurrence(i)} type="button">✕</button>
                </div>
              ))}
              {canAddOccurrence && (
                <button className={styles.addBtn} onClick={onAddOccurrence} type="button">
                  + Добавить время
                </button>
              )}
            </div>
          </FormField>

          <FormField label="Преподаватели" hint="Выберите одного или нескольких">
            <div className={styles.teacherSelectList}>
              {batch.teachers.map((t, i) => (
                <div key={t.id} className={styles.teacherSelectRow}>
                  <SearchableSelect
                    options={teachersList
                      .filter((tl) => tl.id === t.id || !batch.teachers.some((bt) => bt.id === tl.id))
                      .map((tl) => ({ value: tl.id, label: tl.name }))}
                    value={t.id}
                    onChange={(newId) => {
                      const newTeacher = teachersList.find((tl) => tl.id === newId);
                      if (newTeacher) {
                        const updated = [...batch.teachers];
                        updated[i] = { id: newTeacher.id, name: newTeacher.name };
                        onUpdate({ teachers: updated });
                      }
                    }}
                    placeholder="— выберите преподавателя —"
                  />
                  <button
                    className={styles.removeBtn}
                    onClick={() => onUpdate({ teachers: batch.teachers.filter((_, idx) => idx !== i) })}
                    type="button"
                  >✕</button>
                </div>
              ))}
              <button
                className={styles.addBtn}
                onClick={() => {
                  const available = teachersList.find((tl) => !batch.teachers.some((bt) => bt.id === tl.id));
                  if (available) {
                    onUpdate({ teachers: [...batch.teachers, { id: available.id, name: available.name }] });
                  } else {
                    onUpdate({ teachers: [...batch.teachers, { id: '', name: '' }] });
                  }
                }}
                type="button"
              >
                + Добавить преподавателя
              </button>
            </div>
          </FormField>

          <FormField label="Аудитории" hint="Можно добавить несколько">
            <div className={styles.audienceList}>
              {batch.audiences.map((a, i) => (
                <div key={i} className={styles.audienceRow}>
                  <SearchableSelect
                    options={roomOptions.map((r) => ({ value: r.id, label: r.label }))}
                    value={a.roomId}
                    onChange={(roomId) => {
                      const roomName = roomOptions.find((r) => r.id === roomId)?.label ?? '';
                      onUpdateAudience(i, { roomId, roomName });
                    }}
                    placeholder="— выберите аудиторию —"
                  />
                  <button className={styles.removeBtn} onClick={() => onRemoveAudience(i)} type="button">✕</button>
                </div>
              ))}
              <button className={styles.addBtn} onClick={onAddAudience} type="button">
                + Добавить аудиторию
              </button>
            </div>
          </FormField>

          {/* Комментарий */}
          <FormField label="Комментарий">
            <textarea
              className="field-input"
              value={batch.comment ?? ''}
              onChange={(e) => onUpdate({ comment: e.target.value })}
              rows={2}
              placeholder="Дополнительная информация..."
            />
          </FormField>
        </div>
      )}
    </div>
  );
};

