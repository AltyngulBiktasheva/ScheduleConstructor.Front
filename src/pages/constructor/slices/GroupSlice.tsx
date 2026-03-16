import React, { useState } from 'react';
import styles from './SliceCard.module.scss';
import treeStyles from './GroupTree.module.scss';

interface Subgroup { id: string; label: string; }
interface Group { id: string; label: string; subgroups: Subgroup[]; }
interface Stream { id: string; label: string; groups: Group[]; }

const MOCK_TREE: Stream[] = [
  {
    id: 'stream-1', label: 'Поток РИ-2023',
    groups: [
      { id: 'ri-230001', label: 'РИ-230001', subgroups: [
        { id: 'ri-230001-1', label: 'РИ-230001/1' },
        { id: 'ri-230001-2', label: 'РИ-230001/2' },
      ]},
      { id: 'ri-230002', label: 'РИ-230002', subgroups: [
        { id: 'ri-230002-1', label: 'РИ-230002/1' },
        { id: 'ri-230002-2', label: 'РИ-230002/2' },
      ]},
    ],
  },
  {
    id: 'stream-2', label: 'Поток МТ-2022',
    groups: [
      { id: 'mt-220001', label: 'МТ-220001', subgroups: [
        { id: 'mt-220001-1', label: 'МТ-220001/1' },
        { id: 'mt-220001-2', label: 'МТ-220001/2' },
      ]},
      { id: 'mt-220002', label: 'МТ-220002', subgroups: [] },
    ],
  },
];

type SelectionMap = Record<string, boolean>;

interface Props {
  onSelect: (entityId: string[], label: string) => void;
}

export const GroupSlice: React.FC<Props> = ({ onSelect }) => {
  const [selected, setSelected] = useState<SelectionMap>({});
  const [expandedStreams, setExpandedStreams] = useState<Set<string>>(new Set(['stream-1']));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleStream = (streamId: string) => {
    setExpandedStreams((prev) => {
      const next = new Set(prev);
      next.has(streamId) ? next.delete(streamId) : next.add(streamId);
      return next;
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const selectStream = (stream: Stream) => {
    const next = { ...selected };
    const allGroupIds = stream.groups.flatMap((g) => [
      g.id, ...g.subgroups.map((s) => s.id),
    ]);
    const streamSelected = next[stream.id];
    next[stream.id] = !streamSelected;
    allGroupIds.forEach((id) => { next[id] = !streamSelected; });
    setSelected(next);
  };

  const selectGroup = (group: Group) => {
    const next = { ...selected };
    const groupSelected = next[group.id];
    next[group.id] = !groupSelected;
    group.subgroups.forEach((s) => { next[s.id] = !groupSelected; });
    setSelected(next);
  };

  const selectSubgroup = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  const getSelectionLabel = () => {
    const parts: string[] = [];
    MOCK_TREE.forEach((stream) => {
      if (selected[stream.id]) { parts.push(stream.label); return; }
      stream.groups.forEach((group) => {
        if (selected[group.id]) { parts.push(group.label); return; }
        group.subgroups.forEach((sub) => {
          if (selected[sub.id]) parts.push(sub.label);
        });
      });
    });
    return parts.join(', ') || '';
  };

  const handleOpen = () => {
    onSelect(selectedIds, getSelectionLabel());
  };

  return (
    <div className={styles.card} style={{ width: 480 }}>
      <h2 className={styles.cardTitle}>Выберите группы</h2>

      <div className={treeStyles.tree}>
        {MOCK_TREE.map((stream) => (
          <div key={stream.id} className={treeStyles.streamNode}>
            <div className={treeStyles.streamRow}>
              <button
                className={treeStyles.expandBtn}
                onClick={() => toggleStream(stream.id)}
              >
                <span className={`${treeStyles.arrow} ${expandedStreams.has(stream.id) ? treeStyles.arrowOpen : ''}`}>▶</span>
              </button>
              <label className={treeStyles.checkLabel}>
                <input
                  type="checkbox"
                  checked={Boolean(selected[stream.id])}
                  onChange={() => selectStream(stream)}
                />
                <span className={treeStyles.streamLabel}>{stream.label}</span>
              </label>
            </div>

            {expandedStreams.has(stream.id) && (
              <div className={treeStyles.groupList}>
                {stream.groups.map((group) => (
                  <div key={group.id} className={treeStyles.groupNode}>
                    <div className={treeStyles.groupRow}>
                      {group.subgroups.length > 0 && (
                        <button
                          className={treeStyles.expandBtn}
                          onClick={() => toggleGroup(group.id)}
                        >
                          <span className={`${treeStyles.arrow} ${expandedGroups.has(group.id) ? treeStyles.arrowOpen : ''}`}>▶</span>
                        </button>
                      )}
                      <label className={treeStyles.checkLabel} style={{ marginLeft: group.subgroups.length === 0 ? 24 : 0 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(selected[group.id])}
                          onChange={() => selectGroup(group)}
                        />
                        <span className={treeStyles.groupLabel}>{group.label}</span>
                      </label>
                    </div>

                    {expandedGroups.has(group.id) && group.subgroups.map((sub) => (
                      <div key={sub.id} className={treeStyles.subgroupRow}>
                        <label className={treeStyles.checkLabel}>
                          <input
                            type="checkbox"
                            checked={Boolean(selected[sub.id])}
                            onChange={() => selectSubgroup(sub.id)}
                          />
                          <span className={treeStyles.subgroupLabel}>{sub.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className={treeStyles.summary}>
          Выбрано: <strong>{getSelectionLabel()}</strong>
        </div>
      )}

      <button className={styles.openBtn} disabled={selectedIds.length === 0} onClick={handleOpen}>
        Открыть расписание
      </button>
    </div>
  );
};
