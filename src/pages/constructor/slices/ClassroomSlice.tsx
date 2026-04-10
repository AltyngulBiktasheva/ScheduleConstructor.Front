import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchClassroomsAll } from '../../../store/slices/classroomsListSlice';
import styles from './SliceCard.module.scss';

interface Props {
  onSelect: (entityId: string, label: string) => void;
}

export const ClassroomSlice: React.FC<Props> = ({ onSelect }) => {
  const dispatch = useAppDispatch();
  const { classrooms, loading } = useAppSelector((s) => s.classroomsList);
  const [buildingName, setBuildingName] = useState('');
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    if (classrooms.length === 0) dispatch(fetchClassroomsAll());
  }, [dispatch, classrooms.length]);

  // Получаем уникальные корпуса из загруженных аудиторий
  const buildings = Array.from(new Set(classrooms.map((c) => c.building))).sort();

  // Аудитории выбранного корпуса
  const rooms = buildingName
    ? classrooms.filter((c) => c.building === buildingName)
    : [];

  const handleBuildingChange = (name: string) => {
    setBuildingName(name);
    setRoomId('');
  };

  const handleOpen = () => {
    const room = classrooms.find((c) => c.id === roomId);
    if (room) onSelect(room.id, `${room.building}, ауд. ${room.name}`);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Выберите аудиторию</h2>

      <div className={styles.field}>
        <label>Корпус</label>
        {loading ? (
          <div>Загрузка…</div>
        ) : (
          <select value={buildingName} onChange={(e) => handleBuildingChange(e.target.value)}>
            <option value="">— выберите корпус —</option>
            {buildings.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.field}>
        <label>Аудитория</label>
        <select value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!buildingName || loading}>
          <option value="">— выберите аудиторию —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <button className={styles.openBtn} disabled={!roomId} onClick={handleOpen}>
        Открыть расписание
      </button>
    </div>
  );
};
