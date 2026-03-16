import React, { useState } from 'react';
import styles from './SliceCard.module.scss';

const MOCK_TEACHERS = [
  'Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.',
  'Смирнова А.А.', 'Козлов В.В.', 'Новикова Е.Н.',
  'Морозов Д.А.', 'Лебедева О.В.', 'Соколов К.Р.',
];

interface Props {
  onSelect: (entityId: string, label: string) => void;
}

export const TeacherSlice: React.FC<Props> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');

  const filtered = MOCK_TEACHERS.filter((t) =>
    t.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpen = () => {
    if (selected) onSelect(selected, selected);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Выберите преподавателя</h2>

      <div className={styles.field}>
        <label>Поиск</label>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(''); }}
          placeholder="Введите ФИО..."
          style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, fontFamily: 'inherit' }}
        />
      </div>

      <div className={styles.field}>
        <label>Преподаватель</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">— выберите преподавателя —</option>
          {filtered.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <button className={styles.openBtn} disabled={!selected} onClick={handleOpen}>
        Открыть расписание
      </button>
    </div>
  );
};
