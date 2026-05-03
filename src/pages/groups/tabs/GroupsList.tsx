import React, { useRef, useEffect, useState } from 'react';
import type { Group, Stream } from '../../../types/group';
import { GroupViewModal } from '../modals/GroupViewModal';
import { StreamViewModal } from '../modals/StreamViewModal';
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
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

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

  return (
    <>
      <div className={styles.toolbar}>
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
          {viewMode === 'groups' ? `${groups.length} групп` : `${streams.length} потоков`}
        </span>
      </div>

      {viewMode === 'groups' ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Группа</th>
                <th>Поток</th>
                <th>Подгруппы</th>
                <th>Кол-во студентов</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
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
      ) : (
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
              {streams.map((s) => {
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
