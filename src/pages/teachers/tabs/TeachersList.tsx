import React, { useRef, useEffect, useState } from 'react';
import type { Teacher } from '../../../types/teacher';
import { TeacherViewModal } from '../modals/TeacherViewModal';
import styles from './TeachersList.module.scss';

interface Props {
  teachers: Teacher[];
  newlyCreatedId: string | null;
  onUpdate: (t: Teacher) => void;
  onDelete: (id: string) => void;
}


export const TeachersList: React.FC<Props> = ({
  teachers,
  newlyCreatedId,
  onUpdate,
  onDelete,
}) => {
  const [selected, setSelected] = useState<Teacher | null>(null);
  const [query, setQuery] = useState('');
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (newlyCreatedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [newlyCreatedId]);

  const filtered = query
    ? teachers.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : teachers;

  return (
    <>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по ФИО..."
        />
        <span className={styles.count}>{filtered.length} преподавателей</span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Преподаватели не найдены</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ФИО</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                  <tr
                    key={t.id}
                    ref={t.id === newlyCreatedId ? highlightRef : null}
                    className={`${styles.row} ${t.id === newlyCreatedId ? styles.highlighted : ''}`}
                    onClick={() => setSelected(t)}
                  >
                    <td className={styles.name}>{t.name}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <TeacherViewModal
          teacher={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => { onUpdate(updated); setSelected(updated); }}
          onDelete={(id) => { onDelete(id); setSelected(null); }}
        />
      )}
    </>
  );
};
