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
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (newlyCreatedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [newlyCreatedId]);

  return (
    <>
      <div className={styles.toolbar}>
        <span className={styles.count}>{schedules.length} проектов расписания</span>
      </div>

      {schedules.length === 0 ? (
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
              {schedules.map((s) => (
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
