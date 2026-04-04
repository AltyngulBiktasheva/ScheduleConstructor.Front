import React, { useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { Stream } from '../../../types/group';
import styles from './StreamForm.module.scss';

interface Props {
  initial?: Stream;
  onSave: (s: Stream) => void;
  onCancel?: () => void;
}

export const StreamForm: React.FC<Props> = ({ initial, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [cypher, setCypher] = useState(initial?.cypher ?? '');
  const [semesterNumber, setSemesterNumber] = useState(initial?.semesterNumber ?? 1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Обязательное поле';
    if (!cypher.trim()) errs.cypher = 'Обязательное поле';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      cypher: cypher.trim(),
      semesterNumber,
      groupIds: initial?.groupIds ?? [],
      disciplineIds: initial?.disciplineIds ?? [],
    });
  };

  return (
    <div className={styles.form}>
      <FormField
        label="Название потока"
        required
        error={errors.name}
        hint="Например: Поток РИ-2023"
      >
        <input
          className="field-input"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
          placeholder="Поток РИ-2023"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </FormField>

      <FormField
        label="Направление обучения (шифр)"
        required
        error={errors.cypher}
        hint="Например: 09.03.03"
      >
        <input
          className="field-input"
          value={cypher}
          onChange={(e) => { setCypher(e.target.value); setErrors((p) => ({ ...p, cypher: '' })); }}
          placeholder="09.03.03"
        />
      </FormField>

      <FormField label="Номер семестра">
        <input
          className="field-input"
          type="number"
          min={1}
          max={12}
          value={semesterNumber}
          onChange={(e) => setSemesterNumber(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
          style={{ width: 120 }}
        />
      </FormField>

      <p className={styles.hint}>
        После создания потока добавьте группы через вкладку «Создать группу» — они автоматически привяжутся к потоку.
      </p>

      <div className={styles.actions}>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>Отмена</Button>
        )}
        <Button variant="primary" onClick={handleSave}>Сохранить</Button>
      </div>
    </div>
  );
};
