import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchGroupsTree } from '../../../store/slices/groupsListSlice';
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
  const [query, setQuery] = useState('');
  const [showFlat, setShowFlat] = useState(true);

  useEffect(() => {
    if (selectedScheduleId && groups.length === 0) dispatch(fetchGroupsTree(selectedScheduleId));
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

  // Группы, не входящие ни в один поток
  const groupsInStreams = new Set(streams.flatMap((s) => s.groupIds));
  const freeGroups = groups.filter((g) => !groupsInStreams.has(g.id));

  // Все группы отсортированные (для плоского списка)
  const allGroupsSorted = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
    [groups],
  );

  // Фильтрация по запросу
  const lowerQuery = query.toLowerCase();
  const matchesQuery = (name: string) => !query || name.toLowerCase().includes(lowerQuery);

  const selectStream = (stream: Stream) => {
    setSelected((prev) => ({ ...prev, [stream.id]: !prev[stream.id] }));
  };

  const selectGroup = (group: Group) => {
    setSelected((prev) => ({ ...prev, [group.id]: !prev[group.id] }));
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
    freeGroups.forEach((group) => {
      if (selected[group.id]) { parts.push(group.name); return; }
      group.subgroups.forEach((sub) => { if (selected[sub.id]) parts.push(sub.name); });
    });
    return parts.join(', ') || '';
  };

  return (
    <div className={styles.card} style={{ width: 480 }}>
      <h2 className={styles.cardTitle}>Выберите группы</h2>

      {/* Поиск */}
      <div className={styles.field}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск группы..."
          style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {loading ? (
        <div>Загрузка…</div>
      ) : (
        <>
          {/* Переключатель вида */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <button
              type="button"
              onClick={() => setShowFlat(true)}
              style={{
                padding: '4px 12px', border: '1px solid #e5e7eb', borderRadius: 6,
                background: showFlat ? '#eff6ff' : '#fff', color: showFlat ? '#3b82f6' : '#6b7280',
                borderColor: showFlat ? '#3b82f6' : '#e5e7eb', cursor: 'pointer', fontSize: 12,
              }}
            >
              Все группы
            </button>
            <button
              type="button"
              onClick={() => setShowFlat(false)}
              style={{
                padding: '4px 12px', border: '1px solid #e5e7eb', borderRadius: 6,
                background: !showFlat ? '#eff6ff' : '#fff', color: !showFlat ? '#3b82f6' : '#6b7280',
                borderColor: !showFlat ? '#3b82f6' : '#e5e7eb', cursor: 'pointer', fontSize: 12,
              }}
            >
              По потокам
            </button>
          </div>

          {showFlat ? (
            /* ── Плоский список всех групп ── */
            <div className={treeStyles.tree}>
              {allGroupsSorted
                .filter((g) => matchesQuery(g.name))
                .map((group) => (
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
          ) : (
            /* ── Дерево по потокам ── */
            <div className={treeStyles.tree}>
              {streams
                .filter((s) => matchesQuery(s.name) || getStreamGroups(s).some((g) => matchesQuery(g.name)))
                .map((stream) => {
                  const streamGroups = getStreamGroups(stream).filter((g) => matchesQuery(g.name) || matchesQuery(stream.name));
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

              {/* Группы без потока */}
              {freeGroups.filter((g) => matchesQuery(g.name)).length > 0 && (
                <>
                  {streams.length > 0 && (
                    <div className={treeStyles.streamRow} style={{ marginTop: 8, opacity: 0.6, fontSize: 12 }}>
                      Без потока
                    </div>
                  )}
                  {freeGroups.filter((g) => matchesQuery(g.name)).map((group) => (
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
                </>
              )}
            </div>
          )}
        </>
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
