import React, { useState } from 'react';
import type { Teacher } from '../../types/teacher';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';
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
  const [selectedId, setSelectedId] = useState('');

  const options = teachers.map((t) => ({ value: t.id, label: t.name }));
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
            <label className={styles.label}>Преподаватель</label>
            <SearchableSelect
              options={options}
              value={selectedId}
              onChange={setSelectedId}
              placeholder="— выберите из списка —"
            />
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
