import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchRoomTree } from '../../../store/slices/roomSlice';
import { fetchCampuses } from '../../../store/slices/campusSlice';
import { SearchableSelect } from '../../../components/SearchableSelect/SearchableSelect';
import styles from './SliceCard.module.scss';

interface Props {
  onSelect: (entityId: string, label: string) => void;
}

export const ClassroomSlice: React.FC<Props> = ({ onSelect }) => {
  const dispatch = useAppDispatch();
  const { tree, treeLoading } = useAppSelector((s) => s.room);
  const campusList = useAppSelector((s) => s.campus.list);
  const campusLoading = useAppSelector((s) => s.campus.loading);
  const [campusId, setCampusId] = useState('');
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    if (!tree) dispatch(fetchRoomTree());
    if (campusList.length === 0) dispatch(fetchCampuses());
  }, [dispatch, tree, campusList.length]);

  const loading = treeLoading || campusLoading;

  const buildingOptions = campusList.map((c) => ({ value: c.id, label: c.name }));

  const campusNode = tree?.find((t) => t.campusId === campusId);
  const roomOptions = (campusNode?.childRooms ?? []).map((r) => ({ value: r.id, label: r.name }));

  const handleBuildingChange = (id: string) => {
    setCampusId(id);
    setRoomId('');
  };

  const handleOpen = () => {
    const campus = campusList.find((c) => c.id === campusId);
    const room = campusNode?.childRooms.find((r) => r.id === roomId);
    if (room && campus) onSelect(room.id, `${campus.name}, ауд. ${room.name}`);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Выберите аудиторию</h2>

      <div className={styles.field}>
        <label>Корпус</label>
        {loading ? (
          <div>Загрузка…</div>
        ) : (
          <SearchableSelect
            options={buildingOptions}
            value={campusId}
            onChange={handleBuildingChange}
            placeholder="— выберите корпус —"
          />
        )}
      </div>

      <div className={styles.field}>
        <label>Аудитория</label>
        <SearchableSelect
          options={roomOptions}
          value={roomId}
          onChange={setRoomId}
          placeholder="— выберите аудиторию —"
          disabled={!campusId || loading}
        />
      </div>

      <button className={styles.openBtn} disabled={!roomId} onClick={handleOpen}>
        Открыть расписание
      </button>
    </div>
  );
};
