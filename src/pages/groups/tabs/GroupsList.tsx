import React, { useRef, useEffect, useState } from 'react';
import type { Group, Stream } from '../../../types/group';
import { GroupViewModal } from '../modals/GroupViewModal';
import { StreamViewModal } from '../modals/StreamViewModal';
import { Pagination } from '../../../components/Pagination/Pagination';
import styles from './GroupsList.module.scss';

interface Props {
  groups: Group[];
  streams: Stream[];
  newlyCreatedId: string | null;
  onUpdateGroup: (g: Group) => void;
  onDeleteGroup: (id: string) => void;
  onUpdateStream: (s: Stream) => void;
  onDeleteStream: (id: string) => void;
}

type ViewMode = 'groups' | 'streams';

export const GroupsList: React.FC<Props> = ({
  groups, streams, newlyCreatedId,
  onUpdateGroup, onDeleteGroup,
  onUpdateStream, onDeleteStream,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  const [groupsPage, setGroupsPage] = useState(1);
  const [streamsPage, setStreamsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    if (newlyCreatedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [newlyCreatedId]);

  const getStreamNames = (streamIds: string[] | undefined) => {
    if (!streamIds || streamIds.length === 0) return '—';
    return streamIds
      .map((id) => streams.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '—';
  };

  const getStreamStudentCount = (stream: Stream) =>
    groups.filter((g) => stream.groupIds.includes(g.id)).reduce((sum, g) => sum + g.studentCount, 0);

  const getStreamGroups = (stream: Stream) =>
    groups.filter((g) => stream.groupIds.includes(g.id));

  const filteredGroups = query
    ? groups.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
    : groups;

  const filteredStreams = query
    ? streams.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : streams;

  const groupsStart = (groupsPage - 1) * itemsPerPage;
  const paginatedGroups = filteredGroups.slice(groupsStart, groupsStart + itemsPerPage);

  const streamsStart = (streamsPage - 1) * itemsPerPage;
  const paginatedStreams = filteredStreams.slice(streamsStart, streamsStart + itemsPerPage);

  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setGroupsPage(1);
    setStreamsPage(1);
  };

  return (
    <>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setGroupsPage(1); setStreamsPage(1); }}
          placeholder="Поиск по названию..."
        />
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'groups' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('groups')}
          >
            Группы
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'streams' ? styles.toggleActive : ''}`}
            onClick={() => setViewMode('streams')}
          >
            Потоки
          </button>
        </div>
        <span className={styles.count}>
          {viewMode === 'groups' ? `${filteredGroups.length} групп` : `${filteredStreams.length} потоков`}
        </span>
      </div>

      {viewMode === 'groups' ? (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Поток</th>
                  <th>Команды</th>
                  <th>Кол-во студентов</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGroups.map((g) => (
                  <tr
                    key={g.id}
                    ref={g.id === newlyCreatedId ? highlightRef : null}
                    className={`${styles.row} ${g.id === newlyCreatedId ? styles.highlighted : ''}`}
                    onClick={() => setSelectedGroup(g)}
                  >
                    <td className={styles.name}>{g.name}</td>
                    <td className={styles.secondary}>{getStreamNames(g.streamIds)}</td>
                    <td className={styles.secondary}>
                      {g.subgroups.length > 0
                        ? g.subgroups.map((s) => s.name).join(', ')
                        : <span className={styles.none}>Нет</span>
                      }
                    </td>
                    <td className={styles.secondary}>{g.studentCount} чел.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={groupsPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredGroups.length}
            onPageChange={setGroupsPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Поток</th>
                  <th>Группы</th>
                  <th>Кол-во студентов</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStreams.map((s) => {
                  const streamGroups = getStreamGroups(s);
                  return (
                    <tr
                      key={s.id}
                      ref={s.id === newlyCreatedId ? highlightRef : null}
                      className={`${styles.row} ${s.id === newlyCreatedId ? styles.highlighted : ''}`}
                      onClick={() => setSelectedStream(s)}
                    >
                      <td className={styles.name}>{s.name}</td>
                      <td className={styles.secondary}>
                        {streamGroups.length > 0
                          ? streamGroups.map((g) => g.name).join(', ')
                          : <span className={styles.none}>Нет групп</span>
                        }
                      </td>
                      <td className={styles.secondary}>{getStreamStudentCount(s)} чел.</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={streamsPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredStreams.length}
            onPageChange={setStreamsPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      )}

      {selectedGroup && (
        <GroupViewModal
          group={selectedGroup}
          streams={streams}
          onClose={() => setSelectedGroup(null)}
          onUpdate={(updated) => { onUpdateGroup(updated); setSelectedGroup(updated); }}
          onDelete={(id) => { onDeleteGroup(id); setSelectedGroup(null); }}
        />
      )}

      {selectedStream && (
        <StreamViewModal
          stream={selectedStream}
          groups={groups}
          streams={streams}
          onClose={() => setSelectedStream(null)}
          onUpdate={(updated) => { onUpdateStream(updated); setSelectedStream(updated); }}
          onDelete={(id) => { onDeleteStream(id); setSelectedStream(null); }}
        />
      )}
    </>
  );
};
