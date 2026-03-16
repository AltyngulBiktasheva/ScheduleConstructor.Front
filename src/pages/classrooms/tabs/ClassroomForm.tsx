import React, { useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { Classroom, ClassroomType } from '../../../types/classroom';
import { CLASSROOM_TYPE_LABELS } from '../../../types/classroom';
import { BUILDING_OPTIONS, type BuildingType } from '../../../constants/buildings';
import styles from './ClassroomForm.module.scss';

function emptyForm(): Omit<Classroom, 'id'> {
  return { name: '', building: 'turgeneva', type: 'standard', capacity: 30 };
}

interface Props {
  initial?: Classroom;
  onSave: (c: Classroom) => void;
  onCancel?: () => void;
}

export const ClassroomForm: React.FC<Props> = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState<Omit<Classroom, 'id'>>(
    initial ? { ...initial } : emptyForm()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Обязательное поле';
    if (!form.building) errs.building = 'Обязательное поле';
    if (form.building === 'other' && !form.buildingName?.trim())
      errs.buildingName = 'Обязательное поле';
    if (!form.type) errs.type = 'Обязательное поле';
    if (!form.capacity || form.capacity < 1) errs.capacity = 'Укажите корректную вместимость';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, id: initial?.id ?? crypto.randomUUID() } as Classroom);
  };

  const handleBuildingChange = (building: BuildingType) => {
    setForm((prev) => ({
      ...prev,
      building,
      buildingName: building === 'other' ? '' : undefined,
    }));
  };

  return (
    <div className={styles.form}>
      <FormField label="Название аудитории" required error={errors.name}
        hint="Может содержать цифры, буквы и спецсимволы, например: 301, А-12, Спортзал">
        <input
          className="field-input"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="301"
          autoFocus
        />
      </FormField>

      <FormField label="Корпус" required error={errors.building}>
        <select
          className="field-input"
          value={form.building}
          onChange={(e) => handleBuildingChange(e.target.value as BuildingType)}
        >
          {BUILDING_OPTIONS.filter((o) => o.value !== 'online').map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </FormField>

      {form.building === 'other' && (
        <FormField label="Название корпуса" required error={errors.buildingName}>
          <input
            className="field-input"
            value={form.buildingName ?? ''}
            onChange={(e) => set('buildingName', e.target.value)}
            placeholder="Спортивный корпус"
          />
        </FormField>
      )}

      <FormField label="Тип аудитории" required error={errors.type}>
        <div className={styles.typeGrid}>
          {(Object.keys(CLASSROOM_TYPE_LABELS) as ClassroomType[]).map((t) => (
            <label
              key={t}
              className={`${styles.typeCard} ${form.type === t ? styles.typeCardActive : ''}`}
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={form.type === t}
                onChange={() => set('type', t)}
              />
              <span className={styles.typeIcon}>{TYPE_ICONS[t]}</span>
              <span className={styles.typeLabel}>{CLASSROOM_TYPE_LABELS[t]}</span>
            </label>
          ))}
        </div>
      </FormField>

      <FormField label="Вместимость" required error={errors.capacity}
        hint="Максимальное количество человек">
        <div className={styles.capacityRow}>
          <input
            className="field-input"
            type="number"
            min={1}
            max={999}
            value={form.capacity}
            onChange={(e) => set('capacity', Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: 120 }}
          />
          <span className={styles.capacityUnit}>чел.</span>
        </div>
      </FormField>

      <div className={styles.actions}>
        {showResetConfirm ? (
          <div className={styles.resetConfirm}>
            <span>Сбросить все поля?</span>
            <Button size="sm" variant="danger" onClick={() => { setForm(emptyForm()); setErrors({}); setShowResetConfirm(false); }}>
              Да, сбросить
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowResetConfirm(false)}>
              Отмена
            </Button>
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
  standard:     '🪑',
  computer:     '💻',
  laboratory:   '🔬',
  amphitheater: '🎭',
};
