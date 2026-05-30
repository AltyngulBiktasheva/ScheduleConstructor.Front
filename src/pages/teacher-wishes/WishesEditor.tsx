import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button/Button';
import { FormField } from '../../components/FormField/FormField';
import type { TeacherWishes, TimeWish, AudienceWish } from '../../types';
import { DAYS } from '../../constants/days';
import { roomApi } from '../../api';
import type { RoomTreeDto } from '../../api';
import { SearchableSelect } from '../../components/SearchableSelect/SearchableSelect';
import { isTimeRangeValid } from '../../utils/validateTime';
import styles from './WishesEditor.module.scss';
import {v4 as uuidv4} from "uuid";

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

interface RoomOption {
  id: string;
  label: string;
}

/** Parse structured comment back into parts */
function parseComment(raw: string): { forbiddenTimeReason: string; forbiddenAudienceReason: string; comment: string } {
  const parts = raw.split('\n-----\n');
  let forbiddenTimeReason = '';
  let forbiddenAudienceReason = '';
  const rest: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith('Причина запрета временных промежутков:')) {
      forbiddenTimeReason = trimmed.replace('Причина запрета временных промежутков:', '').trim();
    } else if (trimmed.startsWith('Причина запрета аудитории:')) {
      forbiddenAudienceReason = trimmed.replace('Причина запрета аудитории:', '').trim();
    } else if (trimmed) {
      rest.push(trimmed);
    }
  }

  return { forbiddenTimeReason, forbiddenAudienceReason, comment: rest.join('\n-----\n') };
}

export const WishesEditor: React.FC<Props> = ({ wishes, onSave, onCancel }) => {
  const parsed = parseComment(wishes.comment ?? '');

  const [form, setForm] = useState<TeacherWishes>({ ...wishes,
    preferredTimes:      [...wishes.preferredTimes],
    undesirableTimes:    [...wishes.undesirableTimes],
    forbiddenTimes:      [...wishes.forbiddenTimes],
    preferredAudiences:  [...wishes.preferredAudiences],
    undesirableAudiences:[...wishes.undesirableAudiences],
    forbiddenAudiences:  [...wishes.forbiddenAudiences],
    comment: parsed.comment,
  });

  const [forbiddenTimeReason, setForbiddenTimeReason] = useState(parsed.forbiddenTimeReason);
  const [forbiddenAudienceReason, setForbiddenAudienceReason] = useState(parsed.forbiddenAudienceReason);
  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);

  useEffect(() => {
    roomApi.getRoomTree().then(({ data }) => {
      const opts: RoomOption[] = [];
      for (const campus of data as RoomTreeDto[]) {
        for (const room of campus.childRooms) {
          opts.push({ id: room.id, label: `${campus.campusName} ${room.name}` });
        }
      }
      setRoomOptions(opts);
    }).catch(() => {});
  }, []);

  // ─── Time wish helpers ───────────────────────────────────────────────────

  const addTimeWish = (key: TimeCategory) => {
    setForm((prev) => ({
      ...prev,
      [key]: [...prev[key], { id: uuidv4(), dayId: 'mon', timeStart: '09:00', timeEnd: '10:30' }],
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
    const first = roomOptions[0];
    setForm((prev) => ({
      ...prev,
      [key]: [...prev[key], { id: uuidv4(), roomId: first?.id ?? '', roomName: first?.label ?? '' }],
    }));
  };

  const removeAudienceWish = (key: AudienceCategory, id: string) => {
    setForm((prev) => ({ ...prev, [key]: prev[key].filter((w) => w.id !== id) }));
  };

  const updateAudienceWishRoom = (key: AudienceCategory, id: string, roomId: string) => {
    const opt = roomOptions.find((o) => o.id === roomId);
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((w) =>
        w.id === id ? { ...w, roomId, roomName: opt?.label ?? '' } : w
      ),
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

      {/* ─── Пожелания по времени ─────────────────────────────── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Пожелания по времени</h3>
        <p className={styles.cardHint}>Пожелания будут учтены по мере возможности</p>

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
                    onBlur={(e) => {
                      const normalized = normalizeTime(e.target.value);
                      updateTimeWish(key, w.id, { timeEnd: normalized });
                      if (!isTimeRangeValid(w.timeStart, normalized)) {
                        setTimeErrors((prev) => ({ ...prev, [w.id]: 'Начало должно быть раньше окончания' }));
                      } else {
                        setTimeErrors((prev) => { const next = { ...prev }; delete next[w.id]; return next; });
                      }
                    }}
                    placeholder="10:30"
                    maxLength={5}
                  />
                  <button className={styles.removeBtn} onClick={() => removeTimeWish(key, w.id)}>✕</button>
                  {timeErrors[w.id] && <span className={styles.timeError}>{timeErrors[w.id]}</span>}
                </div>
              ))}

              <button className={styles.addBtn} onClick={() => addTimeWish(key)}>
                + Добавить
              </button>
            </div>
          ))}
        </div>

        {form.forbiddenTimes.length > 0 && (
          <FormField label="Причина запрета" required>
            <textarea
              className="field-input"
              value={forbiddenTimeReason}
              onChange={(e) => setForbiddenTimeReason(e.target.value)}
              rows={2}
              placeholder="Укажите причину запрета временных промежутков..."
            />
          </FormField>
        )}
      </div>

      {/* ─── Пожелания по аудиториям ──────────────────────────── */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Пожелания по аудиториям</h3>
        <p className={styles.cardHint}>Пожелания будут учтены по мере возможности</p>

        <div className={styles.wishSections}>
          {AUDIENCE_SECTIONS.map(({ key, label, variant }) => (
            <div key={key} className={styles.wishSection}>
              <span className={`${styles.sectionLabel} ${styles[variant]}`}>{label}</span>

              {form[key].map((w: AudienceWish) => (
                <div key={w.id} className={styles.audienceRow}>
                  <SearchableSelect
                    options={roomOptions.map((o) => ({ value: o.id, label: o.label }))}
                    value={w.roomId}
                    onChange={(roomId) => updateAudienceWishRoom(key, w.id, roomId)}
                    placeholder={roomOptions.length === 0 ? 'Загрузка аудиторий…' : '— выберите аудиторию —'}
                    disabled={roomOptions.length === 0}
                  />
                  <button className={styles.removeBtn} onClick={() => removeAudienceWish(key, w.id)}>✕</button>
                </div>
              ))}

              <button className={styles.addBtn} onClick={() => addAudienceWish(key)}>
                + Добавить
              </button>
            </div>
          ))}
        </div>

        {form.forbiddenAudiences.length > 0 && (
          <FormField label="Причина запрета" required>
            <textarea
              className="field-input"
              value={forbiddenAudienceReason}
              onChange={(e) => setForbiddenAudienceReason(e.target.value)}
              rows={2}
              placeholder="Укажите причину запрета аудиторий..."
            />
          </FormField>
        )}
      </div>

      {/* ─── Дополнительные пожелания ───────────────────────────────────────── */}
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
        <Button variant="primary" onClick={() => {
          // Validate time ranges
          const newTimeErrors: Record<string, string> = {};
          for (const cat of TIME_SECTIONS) {
            for (const w of form[cat.key]) {
              if (!isTimeRangeValid(w.timeStart, w.timeEnd)) {
                newTimeErrors[w.id] = 'Начало должно быть раньше окончания';
              }
            }
          }
          if (Object.keys(newTimeErrors).length > 0) {
            setTimeErrors(newTimeErrors);
            return;
          }

          // Assemble comment
          const parts: string[] = [];
          if (form.comment.trim()) {
            parts.push(form.comment.trim());
          }
          if (forbiddenTimeReason.trim()) {
            parts.push(`Причина запрета временных промежутков: ${forbiddenTimeReason.trim()}`);
          }
          if (forbiddenAudienceReason.trim()) {
            parts.push(`Причина запрета аудитории: ${forbiddenAudienceReason.trim()}`);
          }
          const finalComment = parts.join('\n-----\n');

          onSave({ ...form, comment: finalComment });
        }}>Сохранить пожелания</Button>
      </div>
    </div>
  );
};
