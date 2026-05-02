import React, { useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { Teacher } from '../../../types/teacher';
import { emptyWishes } from '../../../types/teacher';
import styles from './TeacherForm.module.scss';

interface Props {
  initial?: Teacher;
  onSave: (t: Teacher) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export const TeacherForm: React.FC<Props> = ({ initial, onSave, onCancel, loading }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [contacts, setContacts] = useState(initial?.contacts ?? '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('Обязательное поле'); return; }
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      contacts: contacts.trim() || undefined,
      wishes: initial?.wishes ?? emptyWishes(),
    });
  };

  return (
    <div className={styles.form}>
      <FormField label="ФИО преподавателя" required error={error}
        hint="Например: Иванов Иван Иванович">
        <input
          className="field-input"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="Фамилия Имя Отчество"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </FormField>

      <FormField label="Контакты" hint="Телефон, email или другая контактная информация">
        <input
          className="field-input"
          value={contacts}
          onChange={(e) => setContacts(e.target.value)}
          placeholder="+7 900 000-00-00 / ivanov@urfu.ru"
        />
      </FormField>

      <div className={styles.actions}>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Отмена</Button>
        )}
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
};
