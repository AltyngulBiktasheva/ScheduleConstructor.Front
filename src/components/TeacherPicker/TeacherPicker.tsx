import React, { useState } from 'react';
import type { Teacher } from '../../types/teacher';
import styles from './Styles.module.scss';

interface Props {
  teachers: Teacher[];
  onSelect: (teacher: Teacher) => void;
  title?: string;
  subtitle?: string;
}

export const TeacherPicker: React.FC<Props> = ({
  teachers,
  onSelect,
  title = 'Выберите преподавателя',
  subtitle = 'Найдите себя в списке',
}) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const filtered = query
    ? teachers.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : teachers;

  const selected = teachers.find((t) => t.id === selectedId);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.icon}>👤</span>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label}>Поиск</label>
            <input
              className={styles.input}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedId(''); }}
              placeholder="Введите ФИО..."
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Преподаватель</label>
            <select
              className={styles.select}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">— выберите из списка —</option>
              {filtered.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          className={styles.btn}
          disabled={!selectedId}
          onClick={() => selected && onSelect(selected)}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
};
