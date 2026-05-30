import React, { useState } from 'react';
import type { Group, Stream } from '../../types/group';
import { GroupTreeSelect } from '../GroupTreeSelect/GroupTreeSelect';
import styles from './Styles.module.scss';

interface Props {
  groups: Group[];
  streams: Stream[];
  onSelect: (ids: string[], label: string) => void;
}

export const GroupPicker: React.FC<Props> = ({ groups, streams, onSelect }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkSelect = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulkDeselect = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  };

  const getLabel = (): string => {
    const parts: string[] = [];
    streams.forEach((stream) => {
      if (selected.has(stream.id)) { parts.push(stream.name); return; }
      groups.filter((g) => stream.groupIds.includes(g.id)).forEach((group) => {
        if (selected.has(group.id)) { parts.push(group.name); return; }
        group.subgroups.forEach((sub) => {
          if (selected.has(sub.id)) parts.push(sub.name);
        });
      });
    });
    return parts.join(', ');
  };

  const handleOpen = () => {
    onSelect(Array.from(selected), getLabel());
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.icon}>🎒</span>
          <h2 className={styles.title}>Выберите группу</h2>
          <p className={styles.subtitle}>Можно выбрать поток, группу или команду</p>
        </div>

        <GroupTreeSelect
          groups={groups}
          streams={streams}
          selectedIds={Array.from(selected)}
          onToggle={handleToggle}
          onBulkSelect={handleBulkSelect}
          onBulkDeselect={handleBulkDeselect}
          showStudentCount
        />

        {selected.size > 0 && (
          <div className={styles.summary}>
            Выбрано: <strong>{getLabel()}</strong>
          </div>
        )}

        <button className={styles.btn} disabled={selected.size === 0} onClick={handleOpen}>
          Открыть расписание
        </button>
      </div>
    </div>
  );
};
