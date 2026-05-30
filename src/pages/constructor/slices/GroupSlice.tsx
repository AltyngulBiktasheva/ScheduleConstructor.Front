import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchGroupsTree } from '../../../store/slices/groupsListSlice';
import type { Group, Stream } from '../../../types/group';
import { GroupTreeSelect } from '../../../components/GroupTreeSelect/GroupTreeSelect';
import styles from './SliceCard.module.scss';

type SelectionMap = Record<string, boolean>;

interface Props {
  onSelect: (entityId: string[], label: string) => void;
}

export const GroupSlice: React.FC<Props> = ({ onSelect }) => {
  const dispatch = useAppDispatch();
  const { groups, streams, loading } = useAppSelector((s) => s.groupsList);
  const selectedScheduleId = useAppSelector((s) => s.schedule.selectedScheduleId);
  const [selected, setSelected] = useState<SelectionMap>({});

  useEffect(() => {
    if (selectedScheduleId && groups.length === 0) dispatch(fetchGroupsTree(selectedScheduleId));
  }, [dispatch, selectedScheduleId, groups.length]);

  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  const getSelectionLabel = () => {
    const parts: string[] = [];
    streams.forEach((stream) => {
      if (selected[stream.id]) { parts.push(stream.name); return; }
      const streamGroups = stream.groupIds.map((id) => groups.find((g) => g.id === id)!).filter(Boolean);
      streamGroups.forEach((group) => {
        if (selected[group.id]) { parts.push(group.name); return; }
        group.subgroups.forEach((sub) => { if (selected[sub.id]) parts.push(sub.name); });
      });
    });
    // Free groups
    const groupsInStreams = new Set(streams.flatMap((s) => s.groupIds));
    groups.filter((g) => !groupsInStreams.has(g.id)).forEach((group) => {
      if (selected[group.id]) { parts.push(group.name); return; }
      group.subgroups.forEach((sub) => { if (selected[sub.id]) parts.push(sub.name); });
    });
    return parts.join(', ') || '';
  };

  const handleToggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBulkSelect = (ids: string[]) => {
    setSelected((prev) => {
      const next = { ...prev };
      ids.forEach((id) => { next[id] = true; });
      return next;
    });
  };

  const handleBulkDeselect = (ids: string[]) => {
    setSelected((prev) => {
      const next = { ...prev };
      ids.forEach((id) => { next[id] = false; });
      return next;
    });
  };

  return (
    <div className={styles.card} style={{ width: 480 }}>
      <h2 className={styles.cardTitle}>Выберите группы</h2>

      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <GroupTreeSelect
          groups={groups}
          streams={streams}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          onBulkSelect={handleBulkSelect}
          onBulkDeselect={handleBulkDeselect}
          showSearch
          showStudentCount
        />
      )}

      <button className={styles.openBtn} disabled={selectedIds.length === 0} onClick={() => onSelect(selectedIds, getSelectionLabel())}>
        Открыть расписание
      </button>
    </div>
  );
};
