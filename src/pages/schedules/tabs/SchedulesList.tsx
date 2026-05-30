import React, { useRef, useEffect, useState } from 'react';
import type { ScheduleRegistryItemDto } from '../../../api';
import { ScheduleViewModal } from '../modals/ScheduleViewModal';
import styles from './SchedulesList.module.scss';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

interface Props {
  schedules: ScheduleRegistryItemDto[];
  newlyCreatedId: string | null;
  onDelete: (id: string) => void;
  onUpdate: (dto: ScheduleRegistryItemDto) => void;
}

export const SchedulesList: React.FC<Props> = ({ schedules, newlyCreatedId, onDelete, onUpdate }) => {
  const [selected, setSelected] = useState<ScheduleRegistryItemDto | null>(null);
  const [query, setQuery] = useState('');
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (newlyCreatedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [newlyCreatedId]);

  const filtered = query
    ? schedules.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : schedules;

  return (
    <>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию..."
        />
        <span className={styles.count}>{filtered.length} проектов расписания</span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Проекты расписания не найдены</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Название</th>
                <th>Начало</th>
                <th>Конец</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  ref={s.id === newlyCreatedId ? highlightRef : null}
                  className={`${styles.row} ${s.id === newlyCreatedId ? styles.highlighted : ''}`}
                  onClick={() => setSelected(s)}
                >
                  <td className={styles.name}>{s.name}</td>
                  <td className={styles.secondary}>{formatDate(s.dateInterval.dateFrom)}</td>
                  <td className={styles.secondary}>{formatDate(s.dateInterval.dateTo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ScheduleViewModal
          schedule={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => { onUpdate(updated); setSelected(updated); }}
          onDelete={(id) => { onDelete(id); setSelected(null); }}
        />
      )}
    </>
  );
};
