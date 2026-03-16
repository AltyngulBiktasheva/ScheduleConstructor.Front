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
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('Обязательное поле'); return; }
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      groupIds: initial?.groupIds ?? [],
      disciplineIds: initial?.disciplineIds ?? [],
    });
  };

  return (
    <div className={styles.form}>
      <FormField label="Название потока" required error={error}
        hint="Например: Поток РИ-2023">
        <input
          className="field-input"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="Поток РИ-2023"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
