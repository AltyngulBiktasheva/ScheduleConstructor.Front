import React, { useState, useEffect } from 'react';
import type { Discipline, WeeklyOccurrence } from '../../types';
import type { AcademicDisciplineType } from '../../api';
import { DAYS } from '../../constants/days';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTeachersAll } from '../../store/slices/teachersListSlice';
import { fetchClassroomsAll } from '../../store/slices/classroomsListSlice';
import { fetchCampuses } from '../../store/slices/campusSlice';
import { fetchGroupsAll } from '../../store/slices/groupsListSlice';
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

interface Props {
  discipline: Discipline;
  onSave: (discipline: Discipline) => void;
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

const ONLINE_VALUE = '__online__';
const OTHER_VALUE = '__other__';

export const EditModal: React.FC<Props> = ({ discipline, onSave, onClose }) => {
  const dispatch = useAppDispatch();
  const teachers = useAppSelector((s) => s.teachersList.teachers);
  const campuses = useAppSelector((s) => s.campus.list);
  const classrooms = useAppSelector((s) => s.classroomsList.classrooms);
  const { groups, streams } = useAppSelector((s) => s.groupsList);

  const [formData, setFormData] = useState<Discipline>(() => ({
    ...discipline,
    occurrences: normalizeToOccurrences(discipline),
  }));
  const [error, setError] = useState('');

  const isStatic = discipline.isStatic;

  // Determine initial campus selection from discipline.roomId
  const initialCampusId = (() => {
    if (discipline.roomId) {
      const room = classrooms.find((c) => c.id === discipline.roomId);
      if (room?.campusId) return room.campusId;
    }
    if (!discipline.roomId && !discipline.audience) return ONLINE_VALUE;
    return OTHER_VALUE;
  })();

  const [selectedCampusId, setSelectedCampusId] = useState<string>(initialCampusId);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(discipline.roomId ?? '');
  const [otherRoomName, setOtherRoomName] = useState<string>(
    selectedCampusId === OTHER_VALUE ? (discipline.audience ?? '') : '',
  );
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

  const roomsForCampus = classrooms.filter((c) => c.campusId === selectedCampusId);

  const handleCampusChange = (campusId: string) => {
    setSelectedCampusId(campusId);
    setSelectedRoomId('');
    setOtherRoomName('');
  };

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
    if (!isStatic && selectedCampusId === OTHER_VALUE && !otherRoomName.trim()) {
      setError('Укажите название аудитории'); return;
    }

    const teacher = teachers.find((t) => t.id === selectedTeacherId);

    let roomId: string | undefined;
    let audience: string | undefined;
    let building: string | undefined;
    let buildingName: string | undefined;

    if (isStatic) {
      // Для статических — не меняем аудиторию/корпус
      roomId = discipline.roomId;
      audience = discipline.audience;
      building = discipline.building;
      buildingName = discipline.buildingName;
    } else if (selectedCampusId === ONLINE_VALUE) {
      building = 'online';
    } else if (selectedCampusId === OTHER_VALUE) {
      building = 'other';
      buildingName = otherRoomName.trim();
      audience = otherRoomName.trim();
    } else {
      const campus = campuses.find((c) => c.id === selectedCampusId);
      building = campus?.name ?? selectedCampusId;
      roomId = selectedRoomId || undefined;
      const room = classrooms.find((c) => c.id === selectedRoomId);
      audience = room?.name;
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
    });
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

        <div className={styles.form}>
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

          {/* ── Read-only: Группы ── */}
          {groupNames.length > 0 && (
            <Field label="Группы">
              <span className={styles.readOnlyValue}>{groupNames.join(', ')}</span>
            </Field>
          )}

          {/* ── Read-only: Часы ── */}
          <Field label="Часы">
            <span className={styles.readOnlyValue}>{discipline.totalHoursCount ?? '—'}</span>
          </Field>

          {/* ── Read-only: Совмещение ── */}
          <Field label="Совмещение">
            <span className={styles.readOnlyValue}>
              {discipline.canOverlap ? 'По выбору' : 'Обязательная'}
            </span>
          </Field>

          {/* ── Read-only: Повторение ── */}
          <Field label="Повторение">
            <span className={styles.readOnlyValue}>
              {REPEAT_LABELS[discipline.repeat] ?? discipline.repeat}
            </span>
          </Field>

          {/* ── Read-only: Кол-во раз в неделю ── */}
          <Field label="Кол-во раз в неделю">
            <span className={styles.readOnlyValue}>{discipline.weeklyCount ?? 1}</span>
          </Field>

          {/* ── Преподаватель (editable / read-only for static) ── */}
          <Field label="Преподаватель">
            {isStatic ? (
              <span className={styles.readOnlyValue}>
                {discipline.teachers.map((t) => t.name).filter(Boolean).join(', ') || 'Без преподавателя'}
              </span>
            ) : (
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className={styles.select}
              >
                <option value="">— не выбран —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
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
            <>
              <Field label="Корпус">
                <select
                  value={selectedCampusId}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  className={styles.select}
                >
                  <option value={ONLINE_VALUE}>Онлайн</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value={OTHER_VALUE}>Другой корпус</option>
                </select>
              </Field>

              {selectedCampusId !== ONLINE_VALUE && selectedCampusId !== OTHER_VALUE && (
                <Field label="Аудитория">
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">— не выбрана —</option>
                    {roomsForCampus.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </Field>
              )}

              {selectedCampusId === OTHER_VALUE && (
                <Field label="Аудитория *">
                  <input
                    type="text"
                    value={otherRoomName}
                    onChange={(e) => setOtherRoomName(e.target.value)}
                    className={styles.input}
                    placeholder="Название аудитории"
                  />
                </Field>
              )}
            </>
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
