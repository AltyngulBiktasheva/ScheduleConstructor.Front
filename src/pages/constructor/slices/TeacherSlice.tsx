import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTeachersAll } from '../../../store/slices/teachersListSlice';
import styles from './SliceCard.module.scss';

interface Props {
  onSelect: (entityId: string, label: string) => void;
}

export const TeacherSlice: React.FC<Props> = ({ onSelect }) => {
  const dispatch = useAppDispatch();
  const { teachers, loading } = useAppSelector((s) => s.teachersList);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (teachers.length === 0) dispatch(fetchTeachersAll());
  }, [dispatch, teachers.length]);

  const filtered = teachers.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpen = () => {
    const teacher = teachers.find((t) => t.id === selected);
    if (teacher) onSelect(teacher.id, teacher.name);
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
        {loading ? (
          <div>Загрузка…</div>
        ) : (
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">— выберите преподавателя —</option>
            {filtered.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      <button className={styles.openBtn} disabled={!selected} onClick={handleOpen}>
        Открыть расписание
      </button>
    </div>
  );
};
