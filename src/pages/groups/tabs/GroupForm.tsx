import React, { useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { Group, Subgroup, Stream } from '../../../types/group';
import styles from './GroupForm.module.scss';

interface Props {
  initial?: Group;
  streams: Stream[];
  onSave: (g: Group) => void;
  onCancel?: () => void;
}

export const GroupForm: React.FC<Props> = ({ initial, streams, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [streamId, setStreamId] = useState(initial?.streamId ?? (streams[0]?.id ?? ''));
  const [cypher, setCypher] = useState('');
  const [subgroups, setSubgroups] = useState<Subgroup[]>(initial?.subgroups ?? []);
  const [studentCount, setStudentCount] = useState(initial?.studentCount ?? 25);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const selectedStream = streams.find((s) => s.id === streamId);

  const addSubgroup = () => {
    const newName = `${name}/${subgroups.length + 1}`;
    setSubgroups((prev) => [...prev, { id: crypto.randomUUID(), name: newName }]);
  };

  const removeSubgroup = (id: string) =>
    setSubgroups((prev) => prev.filter((s) => s.id !== id));

  const updateSubgroup = (id: string, value: string) =>
    setSubgroups((prev) => prev.map((s) => s.id === id ? { ...s, name: value } : s));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Обязательное поле';
    if (!streamId) errs.streamId = 'Обязательное поле';
    if (!studentCount || studentCount < 1) errs.studentCount = 'Укажите корректное количество';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      streamId,
      cypher: cypher.trim() || undefined,
      subgroups,
      studentCount,
      disciplineIds: initial?.disciplineIds ?? [],
    });
  };

  const handleReset = () => {
    setName(''); setStreamId(streams[0]?.id ?? '');
    setCypher(''); setSubgroups([]); setStudentCount(25);
    setErrors({}); setShowResetConfirm(false);
  };

  return (
    <div className={styles.form}>
      <FormField label="Номер группы" required error={errors.name}
        hint="Например: РИ-230001">
        <input
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="РИ-230001"
          autoFocus
        />
      </FormField>

      <FormField label="Поток" required error={errors.streamId}>
        <select
          className="field-input"
          value={streamId}
          onChange={(e) => setStreamId(e.target.value)}
        >
          {streams.length === 0
            ? <option value="">Нет потоков</option>
            : streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)
          }
        </select>
      </FormField>

      <FormField
        label="Шифр"
        hint={selectedStream?.cypher
          ? `Оставьте пустым, чтобы использовать шифр потока: ${selectedStream.cypher}`
          : 'Оставьте пустым, чтобы использовать шифр потока'}
      >
        <input
          className="field-input"
          value={cypher}
          onChange={(e) => setCypher(e.target.value)}
          placeholder={selectedStream?.cypher ?? 'Шифр группы'}
        />
      </FormField>

      <FormField label="Количество студентов" required error={errors.studentCount}>
        <div className={styles.countRow}>
          <input
            className="field-input"
            type="number"
            min={1}
            max={999}
            value={studentCount}
            onChange={(e) => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: 120 }}
          />
          <span className={styles.unit}>чел.</span>
        </div>
      </FormField>

      <FormField label="Подгруппы" hint="Необязательно. Обычно две подгруппы.">
        <div className={styles.subgroups}>
          {subgroups.map((sg) => (
            <div key={sg.id} className={styles.subgroupRow}>
              <input
                className="field-input"
                value={sg.name}
                onChange={(e) => updateSubgroup(sg.id, e.target.value)}
                placeholder="Название подгруппы"
              />
              <button className={styles.removeBtn} onClick={() => removeSubgroup(sg.id)} type="button">✕</button>
            </div>
          ))}
          <button className={styles.addBtn} onClick={addSubgroup} type="button">
            + Добавить подгруппу
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
