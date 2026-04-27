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
import { LESSON_TYPE_LABELS } from './RootDisciplineForm';
import type { AcademicDisciplineType } from '../../../api';
import { roomApi } from '../../../api';
import type { RoomTreeDto } from '../../../api';
import styles from './DisciplineForm.module.scss';

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

// ─── Copy state ───────────────────────────────────────────────────────────────

interface CopyForm {
  totalHoursCount?: number;
  groupIds: string[];
  isStatic: boolean;
  canOverlap: boolean;
  repeat: RepeatType;
  weeklyCount: number;
  dateRange?: { from: string; to: string };
  occurrences: WeeklyOccurrence[];
  teachers: DisciplineTeacher[];
  audiences: DisciplineAudience[];
  comment: string;
  collapsed: boolean;
}

function emptyCopy(): CopyForm {
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
    comment: '',
    collapsed: false,
  };
}

function copyFromDiscipline(d: Discipline): CopyForm {
  return {
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
    comment: d.comment ?? '',
    collapsed: false,
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initial?: Discipline;
  onSave: (d: Discipline) => void;
  onCancel?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const DisciplineForm: React.FC<Props> = ({ initial, onSave, onCancel }) => {
  const [parentId, setParentId] = useState(initial?.parentId ?? '');
  const [lessonType, setLessonType] = useState<AcademicDisciplineType | undefined>(initial?.lessonType);
  const [copies, setCopies] = useState<CopyForm[]>([
    initial ? copyFromDiscipline(initial) : emptyCopy(),
  ]);
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

  // Combined flat list for group multiselect (streams, groups, subgroups)
  const allGroups = [
    ...streams.map((s) => ({ id: s.id, label: s.name })),
    ...groups.flatMap((g) => [
      { id: g.id, label: g.name },
      ...g.subgroups.map((sg) => ({ id: sg.id, label: `${g.name} / ${sg.name}` })),
    ]),
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

  // ─── Copy helpers ───────────────────────────────────────────────────────────

  const updateCopy = (index: number, patch: Partial<CopyForm>) => {
    setCopies((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const addCopy = () => {
    const last = copies[copies.length - 1];
    setCopies((prev) => [
      ...prev.map((c) => ({ ...c, collapsed: true })),
      { ...last, groupIds: [], collapsed: false },
    ]);
  };

  const removeCopy = (index: number) => {
    setCopies((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCollapse = (index: number) => {
    updateCopy(index, { collapsed: !copies[index].collapsed });
  };

  // ─── Per-copy handlers ──────────────────────────────────────────────────────

  const setWeeklyCount = (index: number, count: number) => {
    const clamped = Math.max(1, Math.min(6, count));
    setCopies((prev) =>
      prev.map((c, i) =>
        i === index
          ? { ...c, weeklyCount: clamped, occurrences: c.occurrences.slice(0, clamped) }
          : c,
      ),
    );
  };

  const addOccurrence = (index: number) => {
    const copy = copies[index];
    if (copy.occurrences.length >= copy.weeklyCount) return;
    updateCopy(index, {
      occurrences: [...copy.occurrences, { dayId: 'mon', timeStart: '09:00', timeEnd: '10:30' }],
    });
  };

  const removeOccurrence = (copyIndex: number, occIndex: number) => {
    updateCopy(copyIndex, {
      occurrences: copies[copyIndex].occurrences.filter((_, i) => i !== occIndex),
    });
  };

  const updateOccurrence = (
    copyIndex: number,
    occIndex: number,
    patch: Partial<WeeklyOccurrence>,
  ) => {
    updateCopy(copyIndex, {
      occurrences: copies[copyIndex].occurrences.map((o, i) =>
        i === occIndex ? { ...o, ...patch } : o,
      ),
    });
  };

  const toggleTeacher = (copyIndex: number, teacher: DisciplineTeacher) => {
    const copy = copies[copyIndex];
    const has = copy.teachers.some((t) => t.id === teacher.id);
    updateCopy(copyIndex, {
      teachers: has ? copy.teachers.filter((t) => t.id !== teacher.id) : [...copy.teachers, teacher],
    });
  };

  const addAudience = (copyIndex: number) => {
    updateCopy(copyIndex, {
      audiences: [...copies[copyIndex].audiences, { roomId: '', roomName: '' }],
    });
  };

  const removeAudience = (copyIndex: number, audIndex: number) => {
    updateCopy(copyIndex, {
      audiences: copies[copyIndex].audiences.filter((_, i) => i !== audIndex),
    });
  };

  const updateAudience = (copyIndex: number, audIndex: number, patch: Partial<DisciplineAudience>) => {
    updateCopy(copyIndex, {
      audiences: copies[copyIndex].audiences.map((a, i) => (i === audIndex ? { ...a, ...patch } : a)),
    });
  };

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!parentId) errs.parentId = 'Обязательное поле';
    if (!lessonType) errs.lessonType = 'Обязательное поле';
    const first = copies[0];
    if (first.groupIds.length === 0) errs.group = 'Выберите хотя бы одну группу';
    if (first.isStatic && first.occurrences.length === 0)
      errs.occurrences = 'Для постоянной дисциплины необходимо указать время';
    if (!first.dateRange?.from) errs.dateFrom = 'Обязательное поле';
    if (!first.dateRange?.to) errs.dateTo = 'Обязательное поле';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Save ───────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!validate()) return;
    const typeLabel = lessonType ? LESSON_TYPE_LABELS[lessonType] : '';
    const generatedName = selectedRoot ? `${selectedRoot.name} (${typeLabel})` : typeLabel;
    const first = copies[0];

    onSave({
      ...first,
      id: initial?.id ?? crypto.randomUUID(),
      name: generatedName,
      parentId,
      lessonType,
      isRoot: false,
      forType: 'group',
      forIds: first.groupIds,
      cypher: selectedRoot?.cypher,
      semesterNumber: selectedRoot?.semesterNumber,
      allowedLessonTypes: undefined,
      roomId: first.audiences[0]?.roomId || undefined,
    } as Discipline);
  };

  const handleReset = () => {
    setParentId('');
    setLessonType(undefined);
    setCopies([emptyCopy()]);
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
        <select
          className="field-input"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">— выберите дисциплину —</option>
          {rootDisciplines.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
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
          disabled={availableLessonTypes.length === 0}
        >
          <option value="">— выберите тип —</option>
          {availableLessonTypes.map((t) => (
            <option key={t} value={t}>{LESSON_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </FormField>

      {/* ── Copies ── */}
      {copies.map((copy, idx) => (
        <CopySection
          key={idx}
          index={idx}
          copy={copy}
          total={copies.length}
          errors={idx === 0 ? errors : {}}
          allGroups={allGroups}
          teachersList={teachersList}
          roomOptions={roomOptions}
          onUpdate={(patch) => updateCopy(idx, patch)}
          onRemove={() => removeCopy(idx)}
          onToggleCollapse={() => toggleCollapse(idx)}
          onAddOccurrence={() => addOccurrence(idx)}
          onRemoveOccurrence={(i) => removeOccurrence(idx, i)}
          onUpdateOccurrence={(i, patch) => updateOccurrence(idx, i, patch)}
          onToggleTeacher={(t) => toggleTeacher(idx, t)}
          onAddAudience={() => addAudience(idx)}
          onRemoveAudience={(i) => removeAudience(idx, i)}
          onUpdateAudience={(i, patch) => updateAudience(idx, i, patch)}
          handleTimeInput={handleTimeInput}
          normalizeTime={normalizeTime}
          handleDateInput={handleDateInput}
        />
      ))}

      <button className={styles.addBtn} onClick={addCopy} type="button">
        + Добавить ещё
      </button>

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
              <Button variant="secondary" onClick={onCancel}>Отмена</Button>
            ) : (
              <Button variant="secondary" onClick={() => setShowResetConfirm(true)}>Сбросить</Button>
            )}
            <Button variant="primary" onClick={handleSave}>Сохранить</Button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── CopySection ─────────────────────────────────────────────────────────────

interface CopySectionProps {
  index: number;
  copy: CopyForm;
  total: number;
  errors: Record<string, string>;
  allGroups: { id: string; label: string }[];
  teachersList: { id: string; name: string }[];
  roomOptions: RoomOption[];
  onUpdate: (patch: Partial<CopyForm>) => void;
  onRemove: () => void;
  onToggleCollapse: () => void;
  onAddOccurrence: () => void;
  onRemoveOccurrence: (i: number) => void;
  onUpdateOccurrence: (i: number, patch: Partial<WeeklyOccurrence>) => void;
  onToggleTeacher: (t: DisciplineTeacher) => void;
  onAddAudience: () => void;
  onRemoveAudience: (i: number) => void;
  onUpdateAudience: (i: number, patch: Partial<DisciplineAudience>) => void;
  handleTimeInput: (raw: string) => string;
  normalizeTime: (val: string) => string;
  handleDateInput: (raw: string) => string;
}

const CopySection: React.FC<CopySectionProps> = ({
  index,
  copy,
  total,
  errors,
  allGroups,
  teachersList,
  roomOptions,
  onUpdate,
  onRemove,
  onToggleCollapse,
  onAddOccurrence,
  onRemoveOccurrence,
  onUpdateOccurrence,
  onToggleTeacher,
  onAddAudience,
  onRemoveAudience,
  onUpdateAudience,
  handleTimeInput,
  normalizeTime,
  handleDateInput,
}) => {
  const selectedGroupLabels = copy.groupIds
    .map((id) => allGroups.find((g) => g.id === id)?.label ?? id);
  const groupSummary = selectedGroupLabels.length === 0
    ? '— не выбраны —'
    : selectedGroupLabels.length <= 2
      ? selectedGroupLabels.join(', ')
      : `${selectedGroupLabels.slice(0, 2).join(', ')}…`;

  const canAddOccurrence = copy.occurrences.length < copy.weeklyCount;

  const toggleGroup = (id: string) => {
    const has = copy.groupIds.includes(id);
    onUpdate({ groupIds: has ? copy.groupIds.filter((g) => g !== id) : [...copy.groupIds, id] });
  };

  return (
    <div className={styles.copySection}>
      {/* Accordion header */}
      <div className={styles.copyHeader}>
        <button
          type="button"
          className={styles.copyToggle}
          onClick={onToggleCollapse}
          title={copy.collapsed ? 'Развернуть' : 'Свернуть'}
        >
          <span className={styles.copyChevron}>{copy.collapsed ? '▶' : '▼'}</span>
          <span className={styles.copyGroupLabel}>
            {index === 0 ? 'Занятие' : `Копия ${index + 1}`}
            {': '}
            <strong>{groupSummary}</strong>
          </span>
        </button>
        {total > 1 && (
          <button type="button" className={styles.copyRemoveBtn} onClick={onRemove} title="Удалить копию">
            ✕
          </button>
        )}
      </div>

      {/* Accordion body */}
      {!copy.collapsed && (
        <div className={styles.copyBody}>
          {/* Группы (мультиселект) */}
          <FormField label="Группы" required error={errors.group}>
            {allGroups.length === 0 ? (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>Нет доступных групп</span>
            ) : (
              <div className={styles.checkList}>
                {allGroups.map((g) => (
                  <label key={g.id} className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={copy.groupIds.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                    />
                    {g.label}
                  </label>
                ))}
              </div>
            )}
          </FormField>

          {/* Количество часов */}
          <FormField label="Количество часов">
            <div className={styles.weeklyCountRow}>
              <input
                className="field-input"
                type="number"
                min={1}
                value={copy.totalHoursCount ?? ''}
                onChange={(e) => onUpdate({ totalHoursCount: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="36"
                style={{ width: 100 }}
              />
              <span className={styles.weeklyCountLabel}>ч.</span>
            </div>
          </FormField>

          {/* Тип + совмещение */}
          <div className={styles.row2}>
            <FormField label="Тип дисциплины" required>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" checked={!copy.isStatic} onChange={() => onUpdate({ isStatic: false })} />
                  Непостоянная
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" checked={copy.isStatic} onChange={() => onUpdate({ isStatic: true })} />
                  Постоянная
                </label>
              </div>
            </FormField>

            <FormField label="Совмещение" required>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" checked={!copy.canOverlap} onChange={() => onUpdate({ canOverlap: false })} />
                  Обязательная
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" checked={copy.canOverlap} onChange={() => onUpdate({ canOverlap: true })} />
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
                value={copy.repeat}
                onChange={(e) => onUpdate({ repeat: e.target.value as RepeatType })}
              >
                {REPEAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Кол-во раз в неделю" hint="от 1 до 6">
              <div className={styles.weeklyCountRow}>
                <input
                  className="field-input"
                  type="number"
                  min={1}
                  max={6}
                  value={copy.weeklyCount}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(6, parseInt(e.target.value) || 1));
                    onUpdate({ weeklyCount: n, occurrences: copy.occurrences.slice(0, n) });
                  }}
                  style={{ width: 72 }}
                />
                <span className={styles.weeklyCountLabel}>раз в неделю</span>
              </div>
            </FormField>
          </div>

          {/* Даты */}
          <div className={styles.row2}>
            <FormField label="Дата начала" required error={errors.dateFrom}>
              <input
                className="field-input"
                value={copy.dateRange?.from ?? ''}
                onChange={(e) =>
                  onUpdate({ dateRange: { from: handleDateInput(e.target.value), to: copy.dateRange?.to ?? '' } })
                }
                placeholder="01.09.2025"
                maxLength={10}
              />
            </FormField>
            <FormField label="Дата окончания" required error={errors.dateTo}>
              <input
                className="field-input"
                value={copy.dateRange?.to ?? ''}
                onChange={(e) =>
                  onUpdate({ dateRange: { from: copy.dateRange?.from ?? '', to: handleDateInput(e.target.value) } })
                }
                placeholder="31.12.2025"
                maxLength={10}
              />
            </FormField>
          </div>
          <FormField
            label="Время проведения"
            required
            error={errors.occurrences}
            hint={copy.weeklyCount > 1 ? `Можно добавить до ${copy.weeklyCount} промежутков` : undefined}
          >
            <div className={styles.occurrences}>
              {copy.occurrences.map((occ, i) => (
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
            <div className={styles.checkList}>
              {teachersList.map((t) => (
                <label key={t.id} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={copy.teachers.some((f) => f.id === t.id)}
                    onChange={() => onToggleTeacher({ id: t.id, name: t.name })}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Аудитории" hint="Можно добавить несколько">
            <div className={styles.audienceList}>
              {copy.audiences.map((a, i) => (
                <div key={i} className={styles.audienceRow}>
                  <select
                    className={styles.roomSelect}
                    value={a.roomId}
                    onChange={(e) => {
                      const roomId = e.target.value;
                      const roomName = roomOptions.find((r) => r.id === roomId)?.label ?? '';
                      onUpdateAudience(i, { roomId, roomName });
                    }}
                  >
                    <option value="">— выберите аудиторию —</option>
                    {roomOptions.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
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
              value={copy.comment}
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
