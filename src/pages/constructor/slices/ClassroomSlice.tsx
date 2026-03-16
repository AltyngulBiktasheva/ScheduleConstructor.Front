import React, { useState } from 'react';
import styles from './SliceCard.module.scss';

const BUILDINGS: Record<string, { label: string; rooms: string[] }> = {
  turgeneva: {
    label: 'Тургенева',
    rooms: ['101', '102', '201', '202', '203', '301', '302', '401', '410'],
  },
  kuybysheva: {
    label: 'Куйбышева',
    rooms: ['101', '102', '201', '205', '301', '401', '501'],
  },
};

interface Props {
  onSelect: (entityId: string, label: string) => void;
}

export const ClassroomSlice: React.FC<Props> = ({ onSelect }) => {
  const [buildingId, setBuildingId] = useState('');
  const [roomId, setRoomId] = useState('');

  const rooms = buildingId ? BUILDINGS[buildingId]?.rooms ?? [] : [];

  const handleOpen = () => {
    const buildingLabel = BUILDINGS[buildingId]?.label ?? '';
    onSelect(`${buildingId}/${roomId}`, `${buildingLabel}, ауд. ${roomId}`);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Выберите аудиторию</h2>

      <div className={styles.field}>
        <label>Корпус</label>
        <select value={buildingId} onChange={(e) => { setBuildingId(e.target.value); setRoomId(''); }}>
          <option value="">— выберите корпус —</option>
          {Object.entries(BUILDINGS).map(([id, b]) => (
            <option key={id} value={id}>{b.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label>Аудитория</label>
        <select value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!buildingId}>
          <option value="">— выберите аудиторию —</option>
          {rooms.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <button className={styles.openBtn} disabled={!roomId} onClick={handleOpen}>
        Открыть расписание
      </button>
    </div>
  );
};
