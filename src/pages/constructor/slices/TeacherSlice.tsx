import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTeachersAll } from '../../../store/slices/teachersListSlice';
import { SearchableSelect } from '../../../components/SearchableSelect/SearchableSelect';
import styles from './SliceCard.module.scss';

interface Props {
  onSelect: (entityId: string, label: string) => void;
}

export const TeacherSlice: React.FC<Props> = ({ onSelect }) => {
  const dispatch = useAppDispatch();
  const { teachers, loading } = useAppSelector((s) => s.teachersList);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (teachers.length === 0) dispatch(fetchTeachersAll());
  }, [dispatch, teachers.length]);

  const options = teachers.map((t) => ({ value: t.id, label: t.name }));

  const handleOpen = () => {
    const teacher = teachers.find((t) => t.id === selected);
    if (teacher) onSelect(teacher.id, teacher.name);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Выберите преподавателя</h2>

      <div className={styles.field}>
        <label>Преподаватель</label>
        {loading ? (
          <div>Загрузка…</div>
        ) : (
          <SearchableSelect
            options={options}
            value={selected}
            onChange={setSelected}
            placeholder="— выберите преподавателя —"
          />
        )}
      </div>

      <button className={styles.openBtn} disabled={!selected} onClick={handleOpen}>
        Открыть расписание
      </button>
    </div>
  );
};
