import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchGroupsAll } from '../../../store/slices/groupsListSlice';
import type { Group, Stream } from '../../../types/group';
import styles from './SliceCard.module.scss';
import treeStyles from './GroupTree.module.scss';

type SelectionMap = Record<string, boolean>;

interface Props {
  onSelect: (entityId: string[], label: string) => void;
}

export const GroupSlice: React.FC<Props> = ({ onSelect }) => {
  const dispatch = useAppDispatch();
  const { groups, streams, loading } = useAppSelector((s) => s.groupsList);
  const selectedScheduleId = useAppSelector((s) => s.schedule.selectedScheduleId);
  const [selected, setSelected] = useState<SelectionMap>({});
  const [expandedStreams, setExpandedStreams] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedScheduleId && groups.length === 0) dispatch(fetchGroupsAll());
  }, [dispatch, selectedScheduleId, groups.length]);

  // Авто-раскрываем первый поток при загрузке
  useEffect(() => {
    if (streams.length > 0) {
      setExpandedStreams(new Set([streams[0].id]));
    }
  }, [streams]);

  const toggleStream = (id: string) =>
    setExpandedStreams((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const getStreamGroups = (stream: Stream): Group[] =>
    stream.groupIds.map((id) => groups.find((g) => g.id === id)!).filter(Boolean);

  const selectStream = (stream: Stream) => {
    const streamGroups = getStreamGroups(stream);
    const allIds = [stream.id, ...streamGroups.flatMap((g) => [g.id, ...g.subgroups.map((s) => s.id)])];
    const wasOn = Boolean(selected[stream.id]);
    setSelected((prev) => {
      const next = { ...prev };
      allIds.forEach((id) => { next[id] = !wasOn; });
      return next;
    });
  };

  const selectGroup = (group: Group) => {
    const allIds = [group.id, ...group.subgroups.map((s) => s.id)];
    const wasOn = Boolean(selected[group.id]);
    setSelected((prev) => {
      const next = { ...prev };
      allIds.forEach((id) => { next[id] = !wasOn; });
      return next;
    });
  };

  const selectSubgroup = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  const getSelectionLabel = () => {
    const parts: string[] = [];
    streams.forEach((stream) => {
      if (selected[stream.id]) { parts.push(stream.name); return; }
      getStreamGroups(stream).forEach((group) => {
        if (selected[group.id]) { parts.push(group.name); return; }
        group.subgroups.forEach((sub) => { if (selected[sub.id]) parts.push(sub.name); });
      });
    });
    return parts.join(', ') || '';
  };

  return (
    <div className={styles.card} style={{ width: 480 }}>
      <h2 className={styles.cardTitle}>Выберите группы</h2>

      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <div className={treeStyles.tree}>
          {streams.map((stream) => {
            const streamGroups = getStreamGroups(stream);
            return (
              <div key={stream.id} className={treeStyles.streamNode}>
                <div className={treeStyles.streamRow}>
                  <button className={treeStyles.expandBtn} onClick={() => toggleStream(stream.id)}>
                    <span className={`${treeStyles.arrow} ${expandedStreams.has(stream.id) ? treeStyles.arrowOpen : ''}`}>▶</span>
                  </button>
                  <label className={treeStyles.checkLabel}>
                    <input type="checkbox" checked={Boolean(selected[stream.id])} onChange={() => selectStream(stream)} />
                    <span className={treeStyles.streamLabel}>{stream.name}</span>
                  </label>
                </div>

                {expandedStreams.has(stream.id) && (
                  <div className={treeStyles.groupList}>
                    {streamGroups.map((group) => (
                      <div key={group.id} className={treeStyles.groupNode}>
                        <div className={treeStyles.groupRow}>
                          {group.subgroups.length > 0 && (
                            <button className={treeStyles.expandBtn} onClick={() => toggleGroup(group.id)}>
                              <span className={`${treeStyles.arrow} ${expandedGroups.has(group.id) ? treeStyles.arrowOpen : ''}`}>▶</span>
                            </button>
                          )}
                          <label className={treeStyles.checkLabel} style={{ marginLeft: group.subgroups.length === 0 ? 24 : 0 }}>
                            <input type="checkbox" checked={Boolean(selected[group.id])} onChange={() => selectGroup(group)} />
                            <span className={treeStyles.groupLabel}>{group.name}</span>
                          </label>
                        </div>

                        {expandedGroups.has(group.id) && group.subgroups.map((sub) => (
                          <div key={sub.id} className={treeStyles.subgroupRow}>
                            <label className={treeStyles.checkLabel}>
                              <input type="checkbox" checked={Boolean(selected[sub.id])} onChange={() => selectSubgroup(sub.id)} />
                              <span className={treeStyles.subgroupLabel}>{sub.name}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className={treeStyles.summary}>
          Выбрано: <strong>{getSelectionLabel()}</strong>
        </div>
      )}

      <button className={styles.openBtn} disabled={selectedIds.length === 0} onClick={() => onSelect(selectedIds, getSelectionLabel())}>
        Открыть расписание
      </button>
    </div>
  );
};
