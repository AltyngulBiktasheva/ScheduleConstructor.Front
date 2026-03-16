import React, { useState } from 'react';
import type { Discipline, WeeklyOccurrence } from '../../types';
import { DAYS } from '../../constants/days';
import { BUILDING_OPTIONS, type BuildingType } from '../../constants/buildings';
import styles from './Styles.module.scss';

interface Props {
  discipline: Discipline;
  onSave: (discipline: Discipline) => void;
  onClose: () => void;
}

export const EditModal: React.FC<Props> = ({ discipline, onSave, onClose }) => {
  const [formData, setFormData] = useState<Discipline>({ ...discipline });
  const [error, setError] = useState('');

  const handleBuildingChange = (building: BuildingType) => {
    setFormData({
      ...formData,
      building,
      buildingName: building === 'other' ? '' : undefined,
      audience: building === 'online' ? undefined : formData.audience,
    });
  };

  const handleOccurrenceChange = (index: number, field: keyof WeeklyOccurrence, value: string) => {
    const occs = [...(formData.occurrences || [])];
    occs[index] = { ...occs[index], [field]: value };
    setFormData({ ...formData, occurrences: occs });
  };

  const addOccurrence = () => {
    setFormData({
      ...formData,
      occurrences: [
        ...(formData.occurrences || []),
        { dayId: 'mon', timeStart: '09:00', timeEnd: '10:30' },
      ],
    });
  };

  const removeOccurrence = (index: number) => {
    const occs = (formData.occurrences || []).filter((_, i) => i !== index);
    setFormData({ ...formData, occurrences: occs });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      setError('Название дисциплины обязательно');
      return;
    }
    if (!formData.building) {
      setError('Корпус обязателен');
      return;
    }
    if (formData.building === 'other' && !formData.buildingName) {
      setError('Название корпуса обязательно');
      return;
    }
    onSave(formData);
  };

  const showAudience =
    formData.building === 'turgeneva' ||
    formData.building === 'kuybysheva' ||
    formData.building === 'other';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Редактирование дисциплины</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.form}>
          <Field label="Название *">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={styles.input}
              autoFocus
            />
          </Field>

          <Field label="Преподаватель">
            <input
              type="text"
              value={formData.teacher || ''}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className={styles.input}
            />
          </Field>

          <Field label="Корпус *">
            <select
              value={formData.building}
              onChange={(e) => handleBuildingChange(e.target.value as BuildingType)}
              className={styles.select}
            >
              {BUILDING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>

          {formData.building === 'other' && (
            <Field label="Название корпуса *">
              <input
                type="text"
                value={formData.buildingName || ''}
                onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                className={styles.input}
              />
            </Field>
          )}

          {showAudience && (
            <Field label="Аудитория">
              <input
                type="text"
                value={formData.audience || ''}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                className={styles.input}
                placeholder="например, 301"
              />
            </Field>
          )}

          {formData.isInGrid && (
            <>
              <div className={styles.sectionLabel}>Время проведения</div>

              {(formData.occurrences && formData.occurrences.length > 0) ? (
                <div className={styles.occurrences}>
                  {formData.occurrences.map((occ, i) => (
                    <div key={i} className={styles.occurrence}>
                      <select
                        value={occ.dayId}
                        onChange={(e) => handleOccurrenceChange(i, 'dayId', e.target.value)}
                        className={styles.selectSm}
                      >
                        {DAYS.map((d) => (
                          <option key={d.id} value={d.id}>{d.shortName}</option>
                        ))}
                      </select>
                      <TimeInput
                        value={occ.timeStart}
                        onChange={(v) => handleOccurrenceChange(i, 'timeStart', v)}
                      />
                      <span className={styles.timeSep}>—</span>
                      <TimeInput
                        value={occ.timeEnd}
                        onChange={(v) => handleOccurrenceChange(i, 'timeEnd', v)}
                      />
                      <button className={styles.removeBtn} onClick={() => removeOccurrence(i)}>✕</button>
                    </div>
                  ))}
                  <button className={styles.addBtn} onClick={addOccurrence}>+ Добавить время</button>
                </div>
              ) : (
                <div className={styles.occurrences}>
                  <div className={styles.occurrence}>
                    <select
                      value={formData.dayId || ''}
                      onChange={(e) => setFormData({ ...formData, dayId: e.target.value || undefined })}
                      className={styles.selectSm}
                    >
                      <option value="">—</option>
                      {DAYS.map((d) => (
                        <option key={d.id} value={d.id}>{d.shortName}</option>
                      ))}
                    </select>
                    <TimeInput
                      value={formData.timeStart || ''}
                      onChange={(v) => setFormData({ ...formData, timeStart: v })}
                    />
                    <span className={styles.timeSep}>—</span>
                    <TimeInput
                      value={formData.timeEnd || ''}
                      onChange={(v) => setFormData({ ...formData, timeEnd: v })}
                    />
                  </div>
                  <button className={styles.addBtn} onClick={addOccurrence}>+ Добавить ещё время</button>
                </div>
              )}

              <Field label="Повторение">
                <select
                  value={formData.repeat}
                  onChange={(e) => setFormData({ ...formData, repeat: e.target.value as any })}
                  className={styles.select}
                >
                  <option value="every-week">Каждую неделю</option>
                  <option value="once">Единожды</option>
                  <option value="every-two-weeks">Каждые две недели</option>
                  <option value="custom">Кастомное</option>
                </select>
              </Field>
            </>
          )}

          <Field label="Комментарий">
            <textarea
              value={formData.comment || ''}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className={styles.textarea}
              rows={2}
            />
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className={styles.field}>
    <label className={styles.label}>{label}</label>
    {children}
  </div>
);

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
}

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^\d]/g, '');
    if (raw.length > 4) raw = raw.slice(0, 4);

    let masked = raw;
    if (raw.length > 2) {
      masked = raw.slice(0, 2) + ':' + raw.slice(2);
    }
    onChange(masked);
  };

  const handleBlur = () => {
    if (!value) return;
    const parts = value.split(':');
    const h = Math.min(23, parseInt(parts[0] || '0', 10));
    const m = Math.min(59, parseInt(parts[1] || '0', 10));
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      className={styles.timeInput}
      placeholder="ЧЧ:ММ"
      maxLength={5}
    />
  );
};
