import React, { useRef, useEffect, useState } from 'react';
import type { Discipline } from '../../../types/discipline';
import { Badge } from '../../../components/Badge/Badge';
import { DisciplineViewModal } from '../modals/DisciplineViewModal';
import { DAYS } from '../../../constants/days';
import styles from './DisciplinesList.module.scss';

interface Props {
  disciplines: Discipline[];
  newlyCreatedId: string | null;
  onUpdate: (d: Discipline) => void;
  onDelete: (id: string) => void;
}

export const DisciplinesList: React.FC<Props> = ({
  disciplines,
  newlyCreatedId,
  onUpdate,
  onDelete,
}) => {
  const [selected, setSelected] = useState<Discipline | null>(null);
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (newlyCreatedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [newlyCreatedId]);

  const formatAudiences = (d: Discipline) => {
    if (d.audiences.length === 0) return '—';
    return d.audiences
      .map((a) => {
        if (a.building === 'online') return 'Онлайн';
        const building = a.building === 'turgeneva' ? 'Тургенева'
          : a.building === 'kuybysheva' ? 'Куйбышева'
          : a.buildingName ?? 'Другой';
        return a.audience ? `${building}, ауд. ${a.audience}` : building;
      })
      .join('; ');
  };

  const formatTime = (d: Discipline) => {
    if ((d.occurrences ? d.occurrences : []).length === 0) return '—';
    return (d.occurrences ? d.occurrences : [])
      .map((o) => {
        const day = DAYS.find((day) => day.id === o.dayId)?.shortName ?? o.dayId;
        return `${day} ${o.timeStart}–${o.timeEnd}`;
      })
      .join(', ');
  };

  const formatTeachers = (d: Discipline) =>
    d.teachers.length === 0 ? '—' : d.teachers.map((t) => t.name).join(', ');

  if (disciplines.length === 0) {
    return <div className={styles.empty}>Дисциплины не добавлены</div>;
  }

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Для кого</th>
              <th>Преподаватели</th>
              <th>Аудитории</th>
              <th>Время проведения</th>
            </tr>
          </thead>
          <tbody>
            {disciplines.map((d) => (
              <tr
                key={d.id}
                ref={d.id === newlyCreatedId ? highlightRef : null}
                className={`${styles.row} ${d.id === newlyCreatedId ? styles.highlighted : ''}`}
                onClick={() => setSelected(d)}
              >
                <td>
                  <div className={styles.nameCell}>
                    <span className={styles.name}>{d.name}</span>
                    <div className={styles.badges}>
                      {d.isStatic && <Badge variant="blue">Постоянная</Badge>}
                      {d.canOverlap && <Badge variant="purple">По выбору</Badge>}
                    </div>
                  </div>
                </td>
                <td>
                  <Badge variant={d.forType === 'stream' ? 'green' : 'gray'}>
                    {d.forType === 'stream' ? 'Поток' : 'Группа'}
                  </Badge>
                </td>
                <td className={styles.secondary}>{formatTeachers(d)}</td>
                <td className={styles.secondary}>{formatAudiences(d)}</td>
                <td className={styles.secondary}>{formatTime(d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <DisciplineViewModal
          discipline={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => { onUpdate(updated); setSelected(updated); }}
          onDelete={(id) => { onDelete(id); setSelected(null); }}
        />
      )}
    </>
  );
};
