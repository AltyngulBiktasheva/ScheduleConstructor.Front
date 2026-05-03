import React, { useEffect, useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { Classroom, ClassroomType, BoardType } from '../../../types';
import { CLASSROOM_TYPE_LABELS } from '../../../types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCampuses } from '../../../store/slices/campusSlice';
import styles from './ClassroomForm.module.scss';

// ─── Form ─────────────────────────────────────────────────────────────────────

function emptyForm(firstCampusId = '', firstCampusName = ''): Omit<Classroom, 'id'> {
  return { name: '', building: firstCampusName, campusId: firstCampusId, type: 'standard', capacity: 30, boardType: null, hasProjector: null };
}

interface Props {
  initial?: Classroom;
  onSave: (c: Classroom) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export const ClassroomForm: React.FC<Props> = ({ initial, onSave, onCancel, loading }) => {
  const dispatch = useAppDispatch();
  const campuses = useAppSelector((s) => s.campus.list);
  const campusLoading = useAppSelector((s) => s.campus.loading);

  // Если корпуса ещё не загружены (маловероятно после ensureDefaultCampuses на старте) — подгружаем
  useEffect(() => {
    if (campuses.length === 0 && !campusLoading) dispatch(fetchCampuses());
  }, []);

  const [form, setForm] = useState<Omit<Classroom, 'id'>>(() =>
    initial ? { ...initial } : emptyForm(campuses[0]?.id, campuses[0]?.name)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Когда кампусы загрузились — установить первый, если ещё не выбран
  useEffect(() => {
    if (!initial && campuses.length > 0 && !form.campusId) {
      setForm((prev) => ({ ...prev, campusId: campuses[0].id, building: campuses[0].name }));
    }
  }, [campuses, initial]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCampusChange = (campusId: string) => {
    const campus = campuses.find((c) => c.id === campusId);
    setForm((prev) => ({ ...prev, campusId, building: campus?.name ?? '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Обязательное поле';
    if (!form.campusId) errs.campusId = 'Выберите корпус';
    if (!form.type) errs.type = 'Обязательное поле';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, id: initial?.id ?? crypto.randomUUID() } as Classroom);
  };

  const handleReset = () => {
    setForm(emptyForm(campuses[0]?.id, campuses[0]?.name));
    setErrors({});
    setShowResetConfirm(false);
  };

  return (
    <div className={styles.form}>
      <FormField label="Название аудитории" required error={errors.name}
        hint="Может содержать цифры, буквы и спецсимволы, например: 301, А-12, Спортзал">
        <input className="field-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="301" autoFocus />
      </FormField>

      <FormField label="Корпус" required error={errors.campusId}>
        {campusLoading && campuses.length === 0 ? (
          <div className={styles.loadingText}>Загрузка корпусов…</div>
        ) : (
          <select
            className="field-input"
            value={form.campusId}
            onChange={(e) => handleCampusChange(e.target.value)}
          >
            {campuses.length === 0 && <option value="">— нет доступных корпусов —</option>}
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </FormField>

      <FormField label="Тип аудитории" required error={errors.type}>
        <div className={styles.typeGrid}>
          {(Object.keys(CLASSROOM_TYPE_LABELS) as ClassroomType[]).map((t) => (
            <label key={t} className={`${styles.typeCard} ${form.type === t ? styles.typeCardActive : ''}`}>
              <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => set('type', t)} />
              <span className={styles.typeIcon}>{TYPE_ICONS[t]}</span>
              <span className={styles.typeLabel}>{CLASSROOM_TYPE_LABELS[t]}</span>
            </label>
          ))}
        </div>
      </FormField>

      <FormField label="Вместимость" error={errors.capacity} hint="Максимальное количество человек">
        <div className={styles.capacityRow}>
          <input className="field-input" type="number" min={0} max={999} value={form.capacity}
            onChange={(e) => set('capacity', parseInt(e.target.value) || 0)} style={{ width: 120 }} />
          <span className={styles.capacityUnit}>чел.</span>
        </div>
      </FormField>

      <FormField label="Тип доски">
        <select
          className="field-input"
          value={form.boardType ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            set('boardType', v === '' ? null : v as BoardType);
          }}
        >
          <option value="">Не указано</option>
          <option value="both">Оба вида доски</option>
          <option value="marker">Только маркерная</option>
          <option value="chalk">Только меловая</option>
        </select>
      </FormField>

      <FormField label="Проектор">
        <select
          className="field-input"
          value={form.hasProjector === null ? '' : String(form.hasProjector)}
          onChange={(e) => {
            const v = e.target.value;
            set('hasProjector', v === '' ? null : v === 'true');
          }}
        >
          <option value="">Не указано</option>
          <option value="true">Есть проектор</option>
          <option value="false">Нет проектора</option>
        </select>
      </FormField>

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
              ? <Button variant="secondary" onClick={onCancel} disabled={loading}>Отмена</Button>
              : <Button variant="secondary" onClick={() => setShowResetConfirm(true)} disabled={loading}>Сбросить</Button>
            }
            <Button variant="primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const TYPE_ICONS: Record<ClassroomType, string> = {
  standard: '🪑', computer: '💻', laboratory: '🔬', amphitheater: '🎭',
};
