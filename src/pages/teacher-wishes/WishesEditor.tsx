import React, { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/FormField/FormField';
import type { TeacherWishes, TimeWish, AudienceWish } from '../../types/teacher';
import { BOARD_TYPE_LABELS, type BoardType } from '../../types/classroom';
import { DAYS } from '../../constants/days';
import { BUILDING_OPTIONS, type BuildingType } from '../../constants/buildings';
import styles from './WishesEditor.module.scss';
import equipStyles from './EquipmentWishes.module.scss';

interface Props {
  wishes: TeacherWishes;
  onSave: (wishes: TeacherWishes) => void;
  onCancel: () => void;
}

type TimeCategory = 'preferredTimes' | 'undesirableTimes' | 'forbiddenTimes';
type AudienceCategory = 'preferredAudiences' | 'undesirableAudiences' | 'forbiddenAudiences';

const TIME_SECTIONS: { key: TimeCategory; label: string; variant: string }[] = [
  { key: 'preferredTimes',   label: 'Желаемое время',       variant: 'preferred' },
  { key: 'undesirableTimes', label: 'Нежелательное время',  variant: 'undesirable' },
  { key: 'forbiddenTimes',   label: 'Запрещённое время',    variant: 'forbidden' },
];

const AUDIENCE_SECTIONS: { key: AudienceCategory; label: string; variant: string }[] = [
  { key: 'preferredAudiences',   label: 'Желаемые аудитории',       variant: 'preferred' },
  { key: 'undesirableAudiences', label: 'Нежелательные аудитории',  variant: 'undesirable' },
  { key: 'forbiddenAudiences',   label: 'Запрещённые аудитории',    variant: 'forbidden' },
];

export const WishesEditor: React.FC<Props> = ({ wishes, onSave, onCancel }) => {
  const [form, setForm] = useState<TeacherWishes>({ ...wishes,
    preferredTimes:      [...wishes.preferredTimes],
    undesirableTimes:    [...wishes.undesirableTimes],
    forbiddenTimes:      [...wishes.forbiddenTimes],
    preferredAudiences:  [...wishes.preferredAudiences],
    undesirableAudiences:[...wishes.undesirableAudiences],
    forbiddenAudiences:  [...wishes.forbiddenAudiences],
  });

  // ─── Time wish helpers ───────────────────────────────────────────────────

  const addTimeWish = (key: TimeCategory) => {
    setForm((prev) => ({
      ...prev,
      [key]: [...prev[key], { id: crypto.randomUUID(), dayId: 'mon', timeStart: '09:00', timeEnd: '10:30' }],
    }));
  };

  const removeTimeWish = (key: TimeCategory, id: string) => {
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((w) => w.id !== id) }));
  };

  const updateTimeWish = (key: TimeCategory, id: string, patch: Partial<TimeWish>) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  };

  // ─── Audience wish helpers ────────────────────────────────────────────────

  const addAudienceWish = (key: AudienceCategory) => {
    setForm((prev) => ({
      ...prev,
      [key]: [...prev[key], { id: crypto.randomUUID(), building: 'turgeneva' as BuildingType }],
    }));
  };

  const removeAudienceWish = (key: AudienceCategory, id: string) => {
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((w) => w.id !== id) }));
  };

  const updateAudienceWish = (key: AudienceCategory, id: string, patch: Partial<AudienceWish>) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  };

  // ─── Time mask ────────────────────────────────────────────────────────────

  const maskTime = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
  };

  const normalizeTime = (val: string) => {
    if (!val.includes(':')) return val;
    const [h, m] = val.split(':').map(Number);
    return `${String(Math.min(23, h || 0)).padStart(2, '0')}:${String(Math.min(59, m || 0)).padStart(2, '0')}`;
  };

  return (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <h2 className={styles.editorTitle}>Редактирование пожеланий</h2>
      </div>

      {/* ─── Статичные пожелания по времени ─────────────────────────────── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Пожелания по времени</h3>
        <p className={styles.cardHint}>Учитываются автоматически при составлении расписания</p>

        <div className={styles.wishSections}>
          {TIME_SECTIONS.map(({ key, label, variant }) => (
            <div key={key} className={styles.wishSection}>
              <span className={`${styles.sectionLabel} ${styles[variant]}`}>{label}</span>

              {form[key].map((w) => (
                <div key={w.id} className={styles.timeRow}>
                  <select
                    className={styles.daySelect}
                    value={w.dayId}
                    onChange={(e) => updateTimeWish(key, w.id, { dayId: e.target.value })}
                  >
                    {DAYS.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <input
                    className={styles.timeInput}
                    value={w.timeStart}
                    onChange={(e) => updateTimeWish(key, w.id, { timeStart: maskTime(e.target.value) })}
                    onBlur={(e) => updateTimeWish(key, w.id, { timeStart: normalizeTime(e.target.value) })}
                    placeholder="09:00"
                    maxLength={5}
                  />
                  <span className={styles.sep}>—</span>
                  <input
                    className={styles.timeInput}
                    value={w.timeEnd}
                    onChange={(e) => updateTimeWish(key, w.id, { timeEnd: maskTime(e.target.value) })}
                    onBlur={(e) => updateTimeWish(key, w.id, { timeEnd: normalizeTime(e.target.value) })}
                    placeholder="10:30"
                    maxLength={5}
                  />
                  <button className={styles.removeBtn} onClick={() => removeTimeWish(key, w.id)}>✕</button>
                </div>
              ))}

              <button className={styles.addBtn} onClick={() => addTimeWish(key)}>
                + Добавить
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Статичные пожелания по аудиториям ──────────────────────────── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Пожелания по аудиториям</h3>
        <p className={styles.cardHint}>Учитываются автоматически при составлении расписания</p>

        <div className={styles.wishSections}>
          {AUDIENCE_SECTIONS.map(({ key, label, variant }) => (
            <div key={key} className={styles.wishSection}>
              <span className={`${styles.sectionLabel} ${styles[variant]}`}>{label}</span>

              {form[key].map((w) => (
                <div key={w.id} className={styles.audienceRow}>
                  <select
                    className={styles.buildingSelect}
                    value={w.building}
                    onChange={(e) => {
                      const building = e.target.value as BuildingType;
                      updateAudienceWish(key, w.id, {
                        building,
                        audience: building === 'online' ? undefined : w.audience,
                        buildingName: building === 'other' ? '' : undefined,
                      });
                    }}
                  >
                    {BUILDING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {w.building === 'other' && (
                    <input
                      className={styles.audienceInput}
                      value={w.buildingName ?? ''}
                      onChange={(e) => updateAudienceWish(key, w.id, { buildingName: e.target.value })}
                      placeholder="Название корпуса"
                    />
                  )}
                  {w.building !== 'online' && (
                    <input
                      className={styles.audienceInput}
                      value={w.audience ?? ''}
                      onChange={(e) => updateAudienceWish(key, w.id, { audience: e.target.value })}
                      placeholder="Аудитория (необязательно)"
                    />
                  )}
                  <button className={styles.removeBtn} onClick={() => removeAudienceWish(key, w.id)}>✕</button>
                </div>
              ))}

              <button className={styles.addBtn} onClick={() => addAudienceWish(key)}>
                + Добавить
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Пожелания по оборудованию ──────────────────────────────────── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Пожелания по оборудованию</h3>
        <p className={styles.cardHint}>Учитываются автоматически при составлении расписания</p>

        <FormField label="Предпочитаемый тип доски">
          <div className={styles.wishSections} style={{ gridTemplateColumns: '1fr' }}>
            <div className={equipStyles.radioGroup}>
              <label className={equipStyles.radioLabel}>
                <input
                  type="radio"
                  name="boardType"
                  checked={form.preferredBoardType === null}
                  onChange={() => setForm((prev) => ({ ...prev, preferredBoardType: null }))}
                />
                Нет предпочтений
              </label>
              {(Object.keys(BOARD_TYPE_LABELS) as BoardType[]).map((b) => (
                <label key={b} className={equipStyles.radioLabel}>
                  <input
                    type="radio"
                    name="boardType"
                    checked={form.preferredBoardType === b}
                    onChange={() => setForm((prev) => ({ ...prev, preferredBoardType: b }))}
                  />
                  {b === 'chalk' ? '🖊️' : '✏️'} {BOARD_TYPE_LABELS[b]}
                </label>
              ))}
            </div>
          </div>
        </FormField>

        <FormField label="Проектор">
          <div className={equipStyles.radioGroup}>
            <label className={equipStyles.radioLabel}>
              <input
                type="radio"
                name="needsProjector"
                checked={form.needsProjector === null}
                onChange={() => setForm((prev) => ({ ...prev, needsProjector: null }))}
              />
              Нет предпочтений
            </label>
            <label className={equipStyles.radioLabel}>
              <input
                type="radio"
                name="needsProjector"
                checked={form.needsProjector === true}
                onChange={() => setForm((prev) => ({ ...prev, needsProjector: true }))}
              />
              📽️ Нужен проектор
            </label>
            <label className={equipStyles.radioLabel}>
              <input
                type="radio"
                name="needsProjector"
                checked={form.needsProjector === false}
                onChange={() => setForm((prev) => ({ ...prev, needsProjector: false }))}
              />
              🚫 Проектор не нужен
            </label>
          </div>
        </FormField>
      </div>

      {/* ─── Нестатичные пожелания ───────────────────────────────────────── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Дополнительные пожелания</h3>
        <p className={styles.cardHint}>Рассматриваются составителями расписания вручную</p>
        <FormField label="Комментарий">
          <textarea
            className="field-input"
            value={form.comment}
            onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
            rows={4}
            placeholder="Любые пожелания, которые сложно формализовать..."
          />
        </FormField>
      </div>

      {/* ─── Actions ─────────────────────────────────────────────────────── */}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel}>Отмена</Button>
        <Button variant="primary" onClick={() => onSave(form)}>Сохранить пожелания</Button>
      </div>
    </div>
  );
};
