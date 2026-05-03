import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedule } from '../../store/slices/scheduleSlice';
import { ROUTES } from '../../router/routes';
import styles from './ScheduleSelector.module.scss';

export const ScheduleSelector: React.FC = () => {
  const navigate = useNavigate();
  const { list, selectedScheduleId, fetchAll, selectSchedule } = useSchedule();

  useEffect(() => {
    fetchAll();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectSchedule(e.target.value || null);
  };

  return (
    <div className={styles.wrapper} data-tour="schedule-selector">
      <span className={styles.label}>Проект расписания:</span>
      <select
        className={styles.select}
        value={selectedScheduleId ?? ''}
        onChange={handleChange}
      >
        <option value="">— не выбран —</option>
        {list.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <button
        className={styles.createBtn}
        onClick={() => navigate(ROUTES.SCHEDULES, { state: { tab: 'create' } })}
      >
        + Создать расписание
      </button>
    </div>
  );
};
