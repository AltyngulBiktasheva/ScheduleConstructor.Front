import React, { useState, useEffect, useCallback } from 'react';
import type { Discipline, WeeklyOccurrence } from '../../types';
import type { AcademicDisciplineType } from '../../api';
import { DAYS } from '../../constants/days';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTeachersAll } from '../../store/slices/teachersListSlice';
import { fetchClassroomsAll } from '../../store/slices/classroomsListSlice';
import { fetchCampuses } from '../../store/slices/campusSlice';
import { fetchGroupsAll } from '../../store/slices/groupsListSlice';
import { Accordion } from '../Accordion/Accordion';
import { Spinner } from '../Spinner/Spinner';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';
import { fetchSlotHighlights } from '../../api/slotHighlights';
import type { SlotHighlight, SlotHighlightMessage } from '../../api/slotHighlights';
import styles from './Styles.module.scss';

const LESSON_TYPE_LABELS: Record<AcademicDisciplineType, string> = {
  Lecture: 'Лекция',
  Practice: 'Практика',
  Lab: 'Лабораторная',
  Exam: 'Экзамен',
  Test: 'Зачёт',
};

const REPEAT_LABELS: Record<string, string> = {
  'every-week': 'Каждую неделю',
  'once': 'Единожды',
  'even-weeks': 'По чётным неделям',
  'odd-weeks': 'По нечётным неделям',
};

export type EditMode = 'lesson' | 'batch';

interface Props {
  discipline: Discipline;
  onSave: (discipline: Discipline, mode: EditMode) => void;
  onClose: () => void;
}

// Нормализуем дисциплину при открытии:
// если есть dayId/timeStart/timeEnd но нет occurrences — переводим в occurrences
function normalizeToOccurrences(discipline: Discipline): WeeklyOccurrence[] {
  if (discipline.occurrences && discipline.occurrences.length > 0) {
    return [...discipline.occurrences];
  }
  if (discipline.dayId && discipline.timeStart && discipline.timeEnd) {
    return [{ dayId: discipline.dayId, timeStart: discipline.timeStart, timeEnd: discipline.timeEnd }];
  }
  return [];
}

/** Компонент баннера ошибки с аккордеоном для детальных ошибок */
const ErrorBanner: React.FC<{
  errorLevel: 'Warning' | 'Error';
  errorMessage?: string;
  lessonId?: string;
}> = ({ errorLevel, errorMessage, lessonId }) => {
  const bannerClass = errorLevel === 'Error' ? styles.errorBanner : styles.warningBanner;
  const text = errorMessage || (errorLevel === 'Error' ? 'Ошибка валидации' : 'Предупреждение');
  const hasErrorCount = /число ошибок/i.test(text);

  const [details, setDetails] = useState<SlotHighlightMessage[] | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!lessonId || details !== null) return;
    setDetailsLoading(true);
    try {
      const highlights = await fetchSlotHighlights({ lessonId });
      const allMessages = highlights.flatMap((h) => h.messages);
      setDetails(allMessages);
    } catch {
      setDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  }, [lessonId, details]);

  // Если нет паттерна "число ошибок" или нет lessonId — простой баннер
  if (!hasErrorCount || !lessonId) {
    return <div className={bannerClass}>{text}</div>;
  }

  return (
    <div className={bannerClass} style={{ padding: 0 }}>
      <Accordion title={text} onFirstOpen={loadDetails}>
        {detailsLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <Spinner size="sm" />
          </div>
        )}
        {details && details.length === 0 && (
          <div style={{ fontSize: 12, color: '#6b7280' }}>Нет подробностей</div>
        )}
        {details && details.length > 0 && (
          <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 13, lineHeight: 1.6 }}>
            {details.map((m, i) => (
              <li key={i}>
                <strong>{m.timeStart}–{m.timeEnd}</strong>: {m.message}
              </li>
            ))}
          </ul>
        )}
      </Accordion>
    </div>
  );
};

export const EditModal: React.FC<Props> = ({ discipline, onSave, onClose }) => {
  const dispatch = useAppDispatch();
  const teachers = useAppSelector((s) => s.teachersList.teachers);
  const campuses = useAppSelector((s) => s.campus.list);
  const classrooms = useAppSelector((s) => s.classroomsList.classrooms);
  const { groups, streams } = useAppSelector((s) => s.groupsList);

  const [editMode, setEditMode] = useState<EditMode>('batch');
  const [formData, setFormData] = useState<Discipline>(() => ({
    ...discipline,
    occurrences: normalizeToOccurrences(discipline),
  }));
  const [error, setError] = useState('');

  const isStatic = discipline.isStatic;

  const [selectedRoomId, setSelectedRoomId] = useState<string>(discipline.roomId ?? '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    discipline.teachers?.[0]?.id ?? '',
  );

  useEffect(() => {
    if (teachers.length === 0) dispatch(fetchTeachersAll());
    if (classrooms.length === 0) dispatch(fetchClassroomsAll());
    if (campuses.length === 0) dispatch(fetchCampuses());
    if (groups.length === 0) dispatch(fetchGroupsAll());
  }, []);

  const weeklyCount = discipline.weeklyCount ?? 1;
  const occurrences = formData.occurrences ?? [];

  const handleOccurrenceChange = (index: number, field: keyof WeeklyOccurrence, value: string) => {
    const occs = [...occurrences];
    occs[index] = { ...occs[index], [field]: value };
    setFormData({ ...formData, occurrences: occs });
  };

  const addOccurrence = () => {
    if (occurrences.length >= weeklyCount) return;
    setFormData({ ...formData, occurrences: [...occurrences, { dayId: 'mon', timeStart: '09:00', timeEnd: '10:30' }] });
  };

  const removeOccurrence = (index: number) => {
    setFormData({ ...formData, occurrences: occurrences.filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    if (!formData.name.trim()) { setError('Название дисциплины обязательно'); return; }

    const teacher = teachers.find((t) => t.id === selectedTeacherId);

    let roomId: string | undefined;
    let audience: string | undefined;
    let building: string | undefined;
    let buildingName: string | undefined;

    if (isStatic) {
      roomId = discipline.roomId;
      audience = discipline.audience;
      building = discipline.building;
      buildingName = discipline.buildingName;
    } else if (selectedRoomId) {
      roomId = selectedRoomId;
      const room = classrooms.find((c) => c.id === selectedRoomId);
      audience = room?.name;
      const campus = campuses.find((c) => c.id === room?.campusId);
      building = campus?.name;
    }

    const firstOcc = occurrences[0];
    onSave({
      ...formData,
      teachers: isStatic
        ? formData.teachers
        : (teacher ? [teacher] : formData.teachers),
      roomId,
      audience,
      building: building as any,
      buildingName,
      dayId: firstOcc?.dayId ?? formData.dayId,
      timeStart: firstOcc?.timeStart ?? formData.timeStart,
      timeEnd: firstOcc?.timeEnd ?? formData.timeEnd,
    }, editMode);
  };

  const canAddOccurrence = !isStatic && occurrences.length < weeklyCount;

  // ── Резолв имён групп ──────────────────────────────────────────────────────
  const groupNames = discipline.forIds.map((id) => {
    const g = groups.find((g) => g.id === id);
    if (g) return g.name;
    for (const gr of groups) {
      const sub = gr.subgroups.find((s) => s.id === id);
      if (sub) return sub.name;
    }
    const s = streams.find((s) => s.id === id);
    if (s) return s.name;
    return id;
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Редактирование дисциплины</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!isStatic && (
          <>
            <div className={styles.modeSelector}>
              <button
                className={`${styles.modeBtn} ${editMode === 'batch' ? styles.modeBtnActive : ''}`}
                onClick={() => setEditMode('batch')}
                type="button"
              >
                Шаблон
              </button>
              <button
                className={`${styles.modeBtn} ${editMode === 'lesson' ? styles.modeBtnActive : ''}`}
                onClick={() => setEditMode('lesson')}
                type="button"
              >
                Занятие
              </button>
            </div>
            <p className={styles.modeHint}>
              {editMode === 'batch'
                ? 'Изменения применятся ко всем занятиям этого шаблона'
                : 'Изменения затронут только это конкретное занятие'}
            </p>
          </>
        )}

        <div className={styles.form}>
          {/* ── Баннер ошибки/предупреждения с аккордеоном ── */}
          {discipline.errorLevel && (
            <ErrorBanner
              errorLevel={discipline.errorLevel}
              errorMessage={discipline.errorMessage}
              lessonId={discipline.lessonId}
            />
          )}

          {/* ── Read-only: Название ── */}
          <Field label="Название">
            <span className={styles.readOnlyValue}>{discipline.name}</span>
          </Field>

          {/* ── Read-only: Вид занятия ── */}
          {discipline.lessonType && (
            <Field label="Вид занятия">
              <span className={styles.readOnlyValue}>
                {LESSON_TYPE_LABELS[discipline.lessonType] ?? discipline.lessonType}
              </span>
            </Field>
          )}

          {/* ── Read-only поля шаблона (скрываются в режиме «Занятие») ── */}
          {editMode === 'batch' && (
            <>
              {groupNames.length > 0 && (
                <Field label="Группы">
                  <span className={styles.readOnlyValue}>{groupNames.join(', ')}</span>
                </Field>
              )}

              <Field label="Часы">
                <span className={styles.readOnlyValue}>{discipline.totalHoursCount ?? '—'}</span>
              </Field>

              <Field label="Совмещение">
                <span className={styles.readOnlyValue}>
                  {discipline.canOverlap ? 'По выбору' : 'Обязательная'}
                </span>
              </Field>

              <Field label="Повторение">
                <span className={styles.readOnlyValue}>
                  {REPEAT_LABELS[discipline.repeat] ?? discipline.repeat}
                </span>
              </Field>

              <Field label="Кол-во раз в неделю">
                <span className={styles.readOnlyValue}>{discipline.weeklyCount ?? 1}</span>
              </Field>
            </>
          )}

          {/* ── Преподаватель (editable / read-only for static) ── */}
          <Field label="Преподаватель">
            {isStatic ? (
              <span className={styles.readOnlyValue}>
                {discipline.teachers.map((t) => t.name).filter(Boolean).join(', ') || 'Без преподавателя'}
              </span>
            ) : (
              <SearchableSelect
                options={teachers.map((t) => ({ value: t.id, label: t.name }))}
                value={selectedTeacherId}
                onChange={setSelectedTeacherId}
                placeholder="— не выбран —"
              />
            )}
          </Field>

          {/* ── Корпус / Аудитория (editable / read-only for static) ── */}
          {isStatic ? (
            <Field label="Аудитория">
              <span className={styles.readOnlyValue}>
                {discipline.building ? `${discipline.building}, ` : ''}
                {discipline.audience || 'Без аудитории'}
              </span>
            </Field>
          ) : (
            <Field label="Аудитория">
              <SearchableSelect
                options={campuses.flatMap((campus) =>
                  classrooms
                    .filter((r) => r.campusId === campus.id)
                    .map((r) => ({ value: r.id, label: `${campus.name} — ${r.name}` }))
                )}
                value={selectedRoomId}
                onChange={setSelectedRoomId}
                placeholder="— не выбрана —"
              />
            </Field>
          )}

          {/* ── Время (editable / read-only for static) ── */}
          {formData.isInGrid && (
            <>
              <div className={styles.sectionLabel}>Время проведения</div>

              {isStatic ? (
                <div className={styles.readOnlyOccurrences}>
                  {occurrences.map((occ, i) => (
                    <div key={i} className={styles.readOnlyValue}>
                      {DAYS.find((d) => d.id === occ.dayId)?.shortName ?? occ.dayId}{' '}
                      {occ.timeStart} — {occ.timeEnd}
                    </div>
                  ))}
                  {occurrences.length === 0 && (
                    <span className={styles.readOnlyValue}>Время не назначено</span>
                  )}
                </div>
              ) : (
                <div className={styles.occurrences}>
                  {occurrences.map((occ, i) => (
                    <div key={i} className={styles.occurrence}>
                      <select value={occ.dayId} onChange={(e) => handleOccurrenceChange(i, 'dayId', e.target.value)} className={styles.selectSm}>
                        {DAYS.map((d) => <option key={d.id} value={d.id}>{d.shortName}</option>)}
                      </select>
                      <TimeInput value={occ.timeStart} onChange={(v) => handleOccurrenceChange(i, 'timeStart', v)} />
                      <span className={styles.timeSep}>—</span>
                      <TimeInput value={occ.timeEnd} onChange={(v) => handleOccurrenceChange(i, 'timeEnd', v)} />
                      {occurrences.length > 1 && (
                        <button className={styles.removeBtn} onClick={() => removeOccurrence(i)}>✕</button>
                      )}
                    </div>
                  ))}
                  {canAddOccurrence && (
                    <button className={styles.addBtn} onClick={addOccurrence}>+ Добавить ещё время</button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Комментарий (always editable) ── */}
          <Field label="Комментарий">
            <textarea value={formData.comment || ''} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} className={styles.textarea} rows={2} />
          </Field>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
            <button className={styles.saveBtn} onClick={handleSave}>Сохранить</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className={styles.field}>
    <label className={styles.label}>{label}</label>
    {children}
  </div>
);

interface TimeInputProps { value: string; onChange: (value: string) => void; }

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d]/g, '');
    if (raw.length > 4) raw = raw.slice(0, 4);
    onChange(raw.length > 2 ? raw.slice(0, 2) + ':' + raw.slice(2) : raw);
  };
  const handleBlur = () => {
    if (!value) return;
    const parts = value.split(':');
    const h = Math.min(23, parseInt(parts[0] || '0', 10));
    const m = Math.min(59, parseInt(parts[1] || '0', 10));
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };
  return <input type="text" value={value} onChange={handleChange} onBlur={handleBlur} className={styles.timeInput} placeholder="ЧЧ:ММ" maxLength={5} />;
};
