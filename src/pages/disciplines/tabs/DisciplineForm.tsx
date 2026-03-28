import React, { useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { Discipline, DisciplineAudience, DisciplineTeacher, WeeklyOccurrence, ForType, RepeatType } from '../../../types';
import { DAYS } from '../../../constants/days';
import { BUILDING_OPTIONS, type BuildingType } from '../../../constants/buildings';
import styles from './DisciplineForm.module.scss';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTeachersAll } from '../../../store/slices/teachersListSlice';

const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: 'every-week', label: 'Каждую неделю' },
  { value: 'once', label: 'Единожды' },
  { value: 'even-weeks', label: 'По чётным неделям' },
  { value: 'odd-weeks', label: 'По нечётным неделям' },
];

function emptyForm(): Omit<Discipline, 'id'> {
  return {
    name: '',
    forType: 'group',
    forIds: [],
    teachers: [],
    audiences: [],
    isStatic: false,
    canOverlap: false,
    repeat: 'every-week',
    weeklyCount: 1,
    occurrences: [],
    dateRange: undefined,
    comment: '',
    isInGrid: false,
  };
}

interface Props {
  initial?: Discipline;
  onSave: (d: Discipline) => void;
  onCancel?: () => void;
}

export const DisciplineForm: React.FC<Props> = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState<Omit<Discipline, 'id'>>(
    initial ? { ...initial, weeklyCount: initial.weeklyCount ?? 1 } : emptyForm()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const dispatch = useAppDispatch();
  const { teachers: teachersList } = useAppSelector((s) => s.teachersList);
  const disciplineTeachers = teachersList.map((t) => ({ id: t.id, name: t.name }));

  useEffect(() => {
    if (teachersList.length === 0) dispatch(fetchTeachersAll());
  }, [dispatch, teachersList.length]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const occurrences = form.occurrences ?? [];
  const weeklyCount = form.weeklyCount ?? 1;

  // ─── Teachers ───────────────────────────────────────────────────────────────
  const toggleTeacher = (teacher: DisciplineTeacher) => {
    const has = form.teachers.some((t) => t.id === teacher.id);
    set('teachers', has ? form.teachers.filter((t) => t.id !== teacher.id) : [...form.teachers, teacher]);
  };

  // ─── Audiences ──────────────────────────────────────────────────────────────
  const addAudience = () => set('audiences', [...form.audiences, { building: 'turgeneva' as BuildingType }]);
  const removeAudience = (i: number) => set('audiences', form.audiences.filter((_, idx) => idx !== i));
  const updateAudience = (i: number, patch: Partial<DisciplineAudience>) =>
    set('audiences', form.audiences.map((a, idx) => idx === i ? { ...a, ...patch } : a));

  // ─── Occurrences (только для статичных) ─────────────────────────────────────
  const addOccurrence = () => {
    if (occurrences.length >= weeklyCount) return;
    set('occurrences', [...occurrences, { dayId: 'mon', timeStart: '09:00', timeEnd: '10:30' }]);
  };
  const removeOccurrence = (i: number) => set('occurrences', occurrences.filter((_, idx) => idx !== i));
  const updateOccurrence = (i: number, patch: Partial<WeeklyOccurrence>) =>
    set('occurrences', occurrences.map((o, idx) => idx === i ? { ...o, ...patch } : o));

  // ─── weeklyCount change — trim occurrences if needed ─────────────────────────
  const handleWeeklyCountChange = (count: number) => {
    const clamped = Math.max(1, Math.min(6, count));
    setForm((prev) => ({
      ...prev,
      weeklyCount: clamped,
      occurrences: (prev.occurrences ?? []).slice(0, clamped),
    }));
  };

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Обязательное поле';
    if (!form.forType) errs.forType = 'Обязательное поле';
    if (form.isStatic && occurrences.length === 0)
      errs.occurrences = 'Для постоянной дисциплины необходимо указать время';
    if (form.isStatic && !form.dateRange?.from)
      errs.dateFrom = 'Обязательное поле для постоянной дисциплины';
    if (form.isStatic && !form.dateRange?.to)
      errs.dateTo = 'Обязательное поле для постоянной дисциплины';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, id: initial?.id ?? crypto.randomUUID() } as Discipline);
  };

  const handleReset = () => { setForm(emptyForm()); setErrors({}); setShowResetConfirm(false); };

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

  const canAddOccurrence = occurrences.length < weeklyCount;

  return (
    <div className={styles.form}>
      {/* Название */}
      <FormField label="Название дисциплины" required error={errors.name}>
        <input className="field-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Математический анализ" />
      </FormField>

      {/* Для кого */}
      <FormField label="Преподаётся для" required error={errors.forType}>
        <div className={styles.radioGroup}>
          {(['group', 'stream'] as ForType[]).map((v) => (
            <label key={v} className={styles.radioLabel}>
              <input type="radio" name="forType" value={v} checked={form.forType === v} onChange={() => set('forType', v)} />
              {v === 'group' ? 'Группы' : 'Потоки'}
            </label>
          ))}
        </div>
      </FormField>

      {/* Тип + совмещение */}
      <div className={styles.row2}>
        <FormField label="Тип дисциплины" required>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input type="radio" checked={!form.isStatic} onChange={() => set('isStatic', false)} />
              Непостоянная
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" checked={form.isStatic} onChange={() => set('isStatic', true)} />
              Постоянная
            </label>
          </div>
        </FormField>

        <FormField label="Совмещение" required>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input type="radio" checked={!form.canOverlap} onChange={() => set('canOverlap', false)} />
              Обязательная
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" checked={form.canOverlap} onChange={() => set('canOverlap', true)} />
              По выбору
            </label>
          </div>
        </FormField>
      </div>

      {/* Повторение + кол-во раз в неделю */}
      <div className={styles.row2}>
        <FormField label="Повторение" required>
          <select className="field-input" value={form.repeat} onChange={(e) => set('repeat', e.target.value as RepeatType)}>
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
              value={weeklyCount}
              onChange={(e) => handleWeeklyCountChange(parseInt(e.target.value) || 1)}
              style={{ width: 72 }}
            />
            <span className={styles.weeklyCountLabel}>раз в неделю</span>
          </div>
        </FormField>
      </div>

      {/* Время и даты — только для постоянных */}
      {form.isStatic && (
        <>
          <FormField
            label="Время проведения"
            required
            error={errors.occurrences}
            hint={weeklyCount > 1 ? `Можно добавить до ${weeklyCount} промежутков времени` : undefined}
          >
            <div className={styles.occurrences}>
              {occurrences.map((occ, i) => (
                <div key={i} className={styles.occurrenceRow}>
                  <select
                    className={styles.daySelect}
                    value={occ.dayId}
                    onChange={(e) => updateOccurrence(i, { dayId: e.target.value })}
                  >
                    {DAYS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <input
                    className={styles.timeInput}
                    value={occ.timeStart}
                    onChange={(e) => updateOccurrence(i, { timeStart: handleTimeInput(e.target.value) })}
                    onBlur={(e) => updateOccurrence(i, { timeStart: normalizeTime(e.target.value) })}
                    placeholder="09:00"
                    maxLength={5}
                  />
                  <span className={styles.timeSep}>—</span>
                  <input
                    className={styles.timeInput}
                    value={occ.timeEnd}
                    onChange={(e) => updateOccurrence(i, { timeEnd: handleTimeInput(e.target.value) })}
                    onBlur={(e) => updateOccurrence(i, { timeEnd: normalizeTime(e.target.value) })}
                    placeholder="10:30"
                    maxLength={5}
                  />
                  <button className={styles.removeBtn} onClick={() => removeOccurrence(i)} type="button">✕</button>
                </div>
              ))}
              {canAddOccurrence && (
                <button className={styles.addBtn} onClick={addOccurrence} type="button">
                  + Добавить время
                </button>
              )}
            </div>
          </FormField>

          <div className={styles.row2}>
            <FormField label="Дата начала" required error={errors.dateFrom}>
              <input
                className="field-input"
                value={form.dateRange?.from ?? ''}
                onChange={(e) => set('dateRange', { from: handleDateInput(e.target.value), to: form.dateRange?.to ?? '' })}
                placeholder="01.09.2025"
                maxLength={10}
              />
            </FormField>
            <FormField label="Дата окончания" required error={errors.dateTo}>
              <input
                className="field-input"
                value={form.dateRange?.to ?? ''}
                onChange={(e) => set('dateRange', { from: form.dateRange?.from ?? '', to: handleDateInput(e.target.value) })}
                placeholder="31.12.2025"
                maxLength={10}
              />
            </FormField>
          </div>
        </>
      )}

      {/* Преподаватели */}
      <FormField label="Преподаватели" hint="Выберите одного или нескольких">
        <div className={styles.checkList}>
          {disciplineTeachers.map((t) => (
            <label key={t.id} className={styles.checkLabel}>
              <input type="checkbox" checked={form.teachers.some((f) => f.id === t.id)} onChange={() => toggleTeacher(t)} />
              {t.name}
            </label>
          ))}
        </div>
      </FormField>

      {/* Аудитории */}
      <FormField label="Аудитории" hint="Можно добавить несколько">
        <div className={styles.audienceList}>
          {form.audiences.map((a, i) => (
            <div key={i} className={styles.audienceRow}>
              <select
                className={styles.buildingSelect}
                value={a.building}
                onChange={(e) => {
                  const building = e.target.value as BuildingType;
                  updateAudience(i, { building, audience: building === 'online' ? undefined : a.audience, buildingName: building === 'other' ? '' : undefined });
                }}
              >
                {BUILDING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {a.building === 'other' && (
                <input className={styles.audienceInput} value={a.buildingName ?? ''} onChange={(e) => updateAudience(i, { buildingName: e.target.value })} placeholder="Название корпуса" />
              )}
              {a.building !== 'online' && (
                <input className={styles.audienceInput} value={a.audience ?? ''} onChange={(e) => updateAudience(i, { audience: e.target.value })} placeholder="Аудитория" />
              )}
              <button className={styles.removeBtn} onClick={() => removeAudience(i)} type="button">✕</button>
            </div>
          ))}
          <button className={styles.addBtn} onClick={addAudience} type="button">+ Добавить аудиторию</button>
        </div>
      </FormField>

      {/* Комментарий */}
      <FormField label="Комментарий">
        <textarea className="field-input" value={form.comment ?? ''} onChange={(e) => set('comment', e.target.value)} rows={3} placeholder="Дополнительная информация..." />
      </FormField>

      {/* Кнопки */}
      <div className={styles.actions}>
        {showResetConfirm ? (
          <div className={styles.resetConfirm}>
            <span>Сбросить все поля?</span>
            <Button size="sm" variant="danger" onClick={handleReset}>Да, сбросить</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowResetConfirm(false)}>Отмена</Button>
          </div>
        ) : (
          <>
            {onCancel
              ? <Button variant="secondary" onClick={onCancel}>Отмена</Button>
              : <Button variant="secondary" onClick={() => setShowResetConfirm(true)}>Сбросить</Button>
            }
            <Button variant="primary" onClick={handleSave}>Сохранить</Button>
          </>
        )}
      </div>
    </div>
  );
};
