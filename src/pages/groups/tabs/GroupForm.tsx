import React, { useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { Group, Subgroup, Stream } from '../../../types/group';
import styles from './GroupForm.module.scss';
import {v4 as uuidv4} from "uuid";

interface Props {
  initial?: Group;
  streams: Stream[];
  onSave: (g: Group) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export const GroupForm: React.FC<Props> = ({ initial, streams, onSave, onCancel, loading }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [streamIds, setStreamIds] = useState<string[]>(initial?.streamIds ?? []);
  const [subgroups, setSubgroups] = useState<Subgroup[]>(initial?.subgroups ?? []);
  const [studentCount, setStudentCount] = useState<number | null>(initial?.studentCount ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toggleStream = (id: string) =>
    setStreamIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const addSubgroup = () => {
    const newName = `${name}/${subgroups.length + 1}`;
    setSubgroups((prev) => [...prev, { id: uuidv4(), name: newName }]);
  };

  const removeSubgroup = (id: string) =>
    setSubgroups((prev) => prev.filter((s) => s.id !== id));

  const updateSubgroup = (id: string, value: string) =>
    setSubgroups((prev) => prev.map((s) => s.id === id ? { ...s, name: value } : s));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Обязательное поле';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    // ── Вычисляем childIds и semiGroupToCreateNames ──
    const originalSubgroups = initial?.subgroups ?? [];
    const originalIds = new Set(originalSubgroups.map((s) => s.id));

    // Подгруппы с серверным ID, которые остались в списке
    const keptServerSubgroups = subgroups.filter((s) => originalIds.has(s.id));

    // Среди оставшихся серверных — найти переименованные
    const renamedIds = new Set<string>();
    for (const kept of keptServerSubgroups) {
      const orig = originalSubgroups.find((o) => o.id === kept.id);
      if (orig && orig.name !== kept.name) {
        renamedIds.add(kept.id);
      }
    }

    // childIds = серверные ID, которые остались И не были переименованы
    const childIds = keptServerSubgroups
      .filter((s) => !renamedIds.has(s.id))
      .map((s) => s.id);

    // semiGroupToCreateNames = новые подгруппы + переименованные (новое имя)
    const newSubgroups = subgroups.filter((s) => !originalIds.has(s.id));
    const renamedSubgroups = keptServerSubgroups.filter((s) => renamedIds.has(s.id));
    const nonRenamedSubGroups = keptServerSubgroups.filter((s) => !renamedIds.has(s.id))
    console.log(nonRenamedSubGroups);
    const children = [
      ...newSubgroups.map((s) => ({ name: s.name })),
      ...renamedSubgroups.map((s) => ({ id: s.id, name: s.name })),
      ...nonRenamedSubGroups.map((s) => ({ id: s.id, name: s.name })),
    ];

    onSave({
      id: initial?.id ?? uuidv4(),
      name: name.trim(),
      streamIds,
      subgroups,
      studentCount: studentCount ?? 0,
      disciplineIds: initial?.disciplineIds ?? [],
      _children: children.length > 0 ? children : undefined,
    });
  };

  const handleReset = () => {
    setName('');
    setStreamIds([]);
    setSubgroups([]);
    setStudentCount(null);
    setErrors({});
    setShowResetConfirm(false);
  };

  return (
    <div className={styles.form}>
      <FormField label="Номер группы" required error={errors.name}
        hint="Например: МЕН-230001">
        <input
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="МЕН-230001"
          autoFocus
        />
      </FormField>

      <FormField label="Поток(и)" hint="Необязательно. Группа может входить в несколько потоков.">
        {streams.length === 0 ? (
          <span className={styles.noStreams}>Нет созданных потоков</span>
        ) : (
          <div className={styles.streamCheckboxes}>
            {streams.map((s) => (
              <label key={s.id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={streamIds.includes(s.id)}
                  onChange={() => toggleStream(s.id)}
                />
                <span>{s.name}</span>
              </label>
            ))}
          </div>
        )}
      </FormField>

      <FormField label="Количество студентов" error={errors.studentCount}>
        <div className={styles.countRow}>
          <input
            className="field-input"
            type="number"
            min={0}
            max={999}
            value={studentCount ?? ''}
            onChange={(e) => setStudentCount(e.target.value === '' ? null : parseInt(e.target.value))}
            placeholder="0"
            style={{ width: 120 }}
          />
          <span className={styles.unit}>чел.</span>
        </div>
      </FormField>

      <FormField label="Команды" hint="Необязательно. Обычно две команды.">
        <div className={styles.subgroups}>
          {subgroups.map((sg) => (
            <div key={sg.id} className={styles.subgroupRow}>
              <input
                className="field-input"
                value={sg.name}
                onChange={(e) => updateSubgroup(sg.id, e.target.value)}
                placeholder="Название команды"
              />
              <button className={styles.removeBtn} onClick={() => removeSubgroup(sg.id)} type="button">✕</button>
            </div>
          ))}
          <button className={styles.addBtn} onClick={addSubgroup} type="button">
            + Добавить команду
          </button>
        </div>
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
