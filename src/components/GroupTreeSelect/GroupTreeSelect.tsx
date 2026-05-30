import React, { useState, useMemo } from 'react';
import type { Group, Stream } from '../../types/group';
import styles from './GroupTreeSelect.module.scss';

export interface GroupTreeSelectProps {
  groups: Group[];
  streams: Stream[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onBulkSelect?: (ids: string[]) => void;
  onBulkDeselect?: (ids: string[]) => void;
  showSearch?: boolean;
  showStudentCount?: boolean;
}

export const GroupTreeSelect: React.FC<GroupTreeSelectProps> = ({
  groups,
  streams,
  selectedIds,
  onToggle,
  onBulkSelect,
  onBulkDeselect,
  showSearch = false,
  showStudentCount = false,
}) => {
  const [expandedStreams, setExpandedStreams] = useState<Set<string>>(() => new Set(streams.map((s) => s.id)));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const toggleExpand = (id: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setter((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const lowerQuery = query.toLowerCase();
  const matchesQuery = (name: string) => !query || name.toLowerCase().includes(lowerQuery);

  // Groups mapped by stream
  const getStreamGroups = (stream: Stream): Group[] =>
    stream.groupIds.map((id) => groups.find((g) => g.id === id)!).filter(Boolean);

  // Groups not in any stream
  const groupsInStreams = useMemo(() => new Set(streams.flatMap((s) => s.groupIds)), [streams]);
  const freeGroups = useMemo(() => groups.filter((g) => !groupsInStreams.has(g.id)), [groups, groupsInStreams]);

  // All IDs for global bulk select
  const allIds = useMemo(() => {
    const ids: string[] = [];
    streams.forEach((s) => ids.push(s.id));
    groups.forEach((g) => {
      ids.push(g.id);
      g.subgroups.forEach((sg) => ids.push(sg.id));
    });
    return ids;
  }, [groups, streams]);

  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  if (streams.length === 0 && groups.length === 0) {
    return <span className={styles.empty}>Нет доступных групп</span>;
  }

  // ── Stream bulk helpers ────────────────────────────────────────────────────
  const getStreamChildIds = (stream: Stream): string[] => {
    const ids: string[] = [];
    getStreamGroups(stream).forEach((g) => {
      ids.push(g.id);
      g.subgroups.forEach((sg) => ids.push(sg.id));
    });
    return ids;
  };

  const areAllStreamChildrenSelected = (stream: Stream) => {
    const childIds = getStreamChildIds(stream);
    return childIds.length > 0 && childIds.every((id) => selectedIds.includes(id));
  };

  // ── Group bulk helpers ─────────────────────────────────────────────────────
  const getGroupChildIds = (group: Group): string[] =>
    group.subgroups.map((sg) => sg.id);

  const areAllGroupChildrenSelected = (group: Group) => {
    const childIds = getGroupChildIds(group);
    return childIds.length > 0 && childIds.every((id) => selectedIds.includes(id));
  };

  const renderGroup = (group: Group) => {
    const hasSubs = group.subgroups.length > 0;
    const isExpanded = expandedGroups.has(group.id);
    if (!matchesQuery(group.name) && !group.subgroups.some((sg) => matchesQuery(sg.name))) return null;

    return (
      <div key={group.id} className={styles.groupNode}>
        <div className={styles.groupRow}>
          {hasSubs ? (
            <button type="button" className={styles.expandBtn} onClick={() => toggleExpand(group.id, setExpandedGroups)}>
              <span className={`${styles.arrow} ${isExpanded ? styles.arrowOpen : ''}`}>▶</span>
            </button>
          ) : (
            <span className={styles.spacer} />
          )}
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={selectedIds.includes(group.id)} onChange={() => onToggle(group.id)} />
            <span className={styles.groupLabel}>{group.name}</span>
          </label>
          {showStudentCount && group.studentCount > 0 && (
            <span className={styles.studentCount}>{group.studentCount} чел.</span>
          )}
          {hasSubs && onBulkSelect && onBulkDeselect && (
            <button
              type="button"
              className={styles.rowBulkBtn}
              onClick={() => {
                const childIds = getGroupChildIds(group);
                areAllGroupChildrenSelected(group) ? onBulkDeselect(childIds) : onBulkSelect(childIds);
              }}
            >
              {areAllGroupChildrenSelected(group) ? 'Убрать всё' : 'Выбрать всё'}
            </button>
          )}
        </div>
        {hasSubs && isExpanded && group.subgroups
          .filter((sg) => matchesQuery(sg.name) || matchesQuery(group.name))
          .map((sub) => (
            <div key={sub.id} className={styles.subgroupRow}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={selectedIds.includes(sub.id)} onChange={() => onToggle(sub.id)} />
                <span className={styles.subgroupLabel}>{sub.name}</span>
              </label>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header: search + global bulk */}
      {(showSearch || (onBulkSelect && onBulkDeselect)) && (
        <div className={styles.header}>
          {showSearch && (
            <input
              className={styles.search}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск группы..."
            />
          )}
          {onBulkSelect && onBulkDeselect && (
            <>
              <button type="button" className={styles.bulkBtn} onClick={() => onBulkSelect(allIds)}>Выбрать всё</button>
              <button type="button" className={styles.bulkBtn} onClick={() => onBulkDeselect(allIds)}>Убрать всё</button>
            </>
          )}
        </div>
      )}

      <div className={styles.tree}>
        {/* Streams */}
        {streams
          .filter((s) => matchesQuery(s.name) || getStreamGroups(s).some((g) => matchesQuery(g.name)))
          .map((stream) => {
            const streamGroups = getStreamGroups(stream);
            const isExpanded = expandedStreams.has(stream.id);
            return (
              <div key={stream.id} className={styles.streamNode}>
                <div className={styles.streamRow}>
                  <button type="button" className={styles.expandBtn} onClick={() => toggleExpand(stream.id, setExpandedStreams)}>
                    <span className={`${styles.arrow} ${isExpanded ? styles.arrowOpen : ''}`}>▶</span>
                  </button>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={selectedIds.includes(stream.id)} onChange={() => onToggle(stream.id)} />
                    <span className={styles.streamLabel}>{stream.name}</span>
                  </label>
                  {onBulkSelect && onBulkDeselect && streamGroups.length > 0 && (
                    <button
                      type="button"
                      className={styles.rowBulkBtn}
                      onClick={() => {
                        const childIds = getStreamChildIds(stream);
                        areAllStreamChildrenSelected(stream) ? onBulkDeselect(childIds) : onBulkSelect(childIds);
                      }}
                    >
                      {areAllStreamChildrenSelected(stream) ? 'Убрать всё' : 'Выбрать всё'}
                    </button>
                  )}
                </div>
                {isExpanded && (
                  <div className={styles.groupList}>
                    {streamGroups.map((g) => renderGroup(g))}
                  </div>
                )}
              </div>
            );
          })}

        {/* Free groups (not in any stream) */}
        {freeGroups.filter((g) => matchesQuery(g.name)).length > 0 && (
          <>
            {streams.length > 0 && <div className={styles.sectionLabel}>Без потока</div>}
            {freeGroups.map((g) => renderGroup(g))}
          </>
        )}
      </div>
    </div>
  );
};
