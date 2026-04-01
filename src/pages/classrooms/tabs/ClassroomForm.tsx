import React, { useEffect, useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { Classroom, ClassroomType, BoardType } from '../../../types';
import { CLASSROOM_TYPE_LABELS, BOARD_TYPE_LABELS } from '../../../types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCampuses } from '../../../store/slices/campusSlice';
import styles from './ClassroomForm.module.scss';

function emptyForm(): Omit<Classroom, 'id'> {
  return { name: '', building: '', campusId: '', type: 'standard', capacity: 30, boardType: 'chalk', hasProjector: false };
}

interface Props {
  initial?: Classroom;
  onSave: (c: Classroom) => void;
  onCancel?: () => void;
}

export const ClassroomForm: React.FC<Props> = ({ initial, onSave, onCancel }) => {
  const dispatch = useAppDispatch();
  const { list: campuses, loading: campusesLoading } = useAppSelector((s) => s.campus);

  const [form, setForm] = useState<Omit<Classroom, 'id'>>(
    initial ? { ...initial } : emptyForm()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (campuses.length === 0) dispatch(fetchCampuses());
  }, [dispatch, campuses.length]);

  // При появлении кампусов и если кампус ещё не выбран — выбираем первый
  useEffect(() => {
    if (campuses.length > 0 && !form.campusId) {
      setForm((prev) => ({
        ...prev,
        campusId: campuses[0].id,
        building: campuses[0].name,
      }));
    }
  }, [campuses, form.campusId]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCampusChange = (campusId: string) => {
    const campus = campuses.find((c) => c.id === campusId);
    setForm((prev) => ({
      ...prev,
      campusId,
      building: campus?.name ?? campusId,
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Обязательное поле';
    if (!form.campusId) errs.campusId = 'Выберите корпус';
    if (!form.type) errs.type = 'Обязательное поле';
    if (!form.capacity || form.capacity < 1) errs.capacity = 'Укажите корректную вместимость';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, id: initial?.id ?? crypto.randomUUID() } as Classroom);
  };

  return (
    <div className={styles.form}>
      <FormField label="Название аудитории" required error={errors.name}
        hint="Может содержать цифры, буквы и спецсимволы, например: 301, А-12, Спортзал">
        <input className="field-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="301" autoFocus />
      </FormField>

      <FormField label="Корпус" required error={errors.campusId}>
        {campusesLoading ? (
          <div className={styles.loadingText}>Загрузка корпусов…</div>
        ) : campuses.length === 0 ? (
          <div className={styles.emptyText}>Нет доступных корпусов. Сначала создайте корпус.</div>
        ) : (
          <select
            className="field-input"
            value={form.campusId ?? ''}
            onChange={(e) => handleCampusChange(e.target.value)}
          >
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

      <FormField label="Вместимость" required error={errors.capacity} hint="Максимальное количество человек">
        <div className={styles.capacityRow}>
          <input className="field-input" type="number" min={1} max={999} value={form.capacity}
            onChange={(e) => set('capacity', Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 120 }} />
          <span className={styles.capacityUnit}>чел.</span>
        </div>
      </FormField>

      <FormField label="Тип доски" required>
        <div className={styles.radioGroup}>
          {(Object.keys(BOARD_TYPE_LABELS) as BoardType[]).map((b) => (
            <label key={b} className={styles.radioLabel}>
              <input type="radio" name="boardType" checked={form.boardType === b} onChange={() => set('boardType', b)} />
              <span className={styles.boardIcon}>{b === 'chalk' ? '🖊️' : '✏️'}</span>
              {BOARD_TYPE_LABELS[b]}
            </label>
          ))}
        </div>
      </FormField>

      <FormField label="Проектор" required>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input type="radio" name="hasProjector" checked={!form.hasProjector} onChange={() => set('hasProjector', false)} />
            <span className={styles.boardIcon}>🚫</span>
            Нет
          </label>
          <label className={styles.radioLabel}>
            <input type="radio" name="hasProjector" checked={form.hasProjector} onChange={() => set('hasProjector', true)} />
            <span className={styles.boardIcon}>📽️</span>
            Есть
          </label>
        </div>
      </FormField>

      <div className={styles.actions}>
        {showResetConfirm ? (
          <div className={styles.resetConfirm}>
            <span>Сбросить все поля?</span>
            <Button size="sm" variant="danger" onClick={() => { setForm(emptyForm()); setErrors({}); setShowResetConfirm(false); }}>Да, сбросить</Button>
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

const TYPE_ICONS: Record<ClassroomType, string> = {
  standard: '🪑', computer: '💻', laboratory: '🔬', amphitheater: '🎭',
};
