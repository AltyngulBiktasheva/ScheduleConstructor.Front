import React, { useState } from 'react';
import type { Group, Stream } from '../../types/group';
import styles from './Styles.module.scss';

interface Props {
  groups: Group[];
  streams: Stream[];
  onSelect: (ids: string[], label: string) => void;
}

export const GroupPicker: React.FC<Props> = ({ groups, streams, onSelect }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(streams.map((s) => s.id)));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectStream = (stream: Stream) => {
    const streamGroups = groups.filter((g) => stream.groupIds.includes(g.id));
    const allIds = [stream.id, ...streamGroups.map((g) => g.id),
      ...streamGroups.flatMap((g) => g.subgroups.map((s) => s.id))];
    const isSelected = selected.has(stream.id);
    setSelected((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => isSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const selectGroup = (group: Group) => {
    const allIds = [group.id, ...group.subgroups.map((s) => s.id)];
    const isSelected = selected.has(group.id);
    setSelected((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => isSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const selectSubgroup = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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
          <p className={styles.subtitle}>Можно выбрать поток, группу или подгруппу</p>
        </div>

        <div className={styles.tree}>
          {streams.map((stream) => {
            const streamGroups = groups.filter((g) => stream.groupIds.includes(g.id));
            return (
              <div key={stream.id} className={styles.streamNode}>
                <div className={styles.streamRow}>
                  <button className={styles.expandBtn} onClick={() => toggle(stream.id)}>
                    <span className={`${styles.arrow} ${expanded.has(stream.id) ? styles.arrowOpen : ''}`}>▶</span>
                  </button>
                  <label className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={selected.has(stream.id)}
                      onChange={() => selectStream(stream)}
                    />
                    <span className={styles.streamName}>{stream.name}</span>
                  </label>
                </div>

                {expanded.has(stream.id) && streamGroups.map((group) => (
                  <div key={group.id} className={styles.groupNode}>
                    <div className={styles.groupRow}>
                      {group.subgroups.length > 0 && (
                        <button className={styles.expandBtn} onClick={() => toggle(group.id)}>
                          <span className={`${styles.arrow} ${expanded.has(group.id) ? styles.arrowOpen : ''}`}>▶</span>
                        </button>
                      )}
                      <label className={styles.checkLabel} style={{ marginLeft: group.subgroups.length === 0 ? 24 : 0 }}>
                        <input
                          type="checkbox"
                          checked={selected.has(group.id)}
                          onChange={() => selectGroup(group)}
                        />
                        <span className={styles.groupName}>{group.name}</span>
                        <span className={styles.groupCount}>{group.studentCount} чел.</span>
                      </label>
                    </div>

                    {expanded.has(group.id) && group.subgroups.map((sub) => (
                      <div key={sub.id} className={styles.subgroupRow}>
                        <label className={styles.checkLabel}>
                          <input
                            type="checkbox"
                            checked={selected.has(sub.id)}
                            onChange={() => selectSubgroup(sub.id)}
                          />
                          <span className={styles.subgroupName}>{sub.name}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

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
