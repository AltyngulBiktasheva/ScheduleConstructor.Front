import React, { useRef, useEffect, useState } from 'react';
import type { Classroom } from '../../../types/classroom';
import { CLASSROOM_TYPE_LABELS } from '../../../types/classroom';
import { Badge } from '../../../components/Badge/Badge';
import { ClassroomViewModal } from '../modals/ClassroomViewModal';
import styles from './ClassroomsList.module.scss';

const BUILDING_LABELS: Record<string, string> = {
  turgeneva: 'Тургенева',
  kuybysheva: 'Куйбышева',
  other: 'Другой',
};

const BOARD_LABELS: Record<string, string> = {
  chalk:  '🖊️ Меловая',
  marker: '✏️ Маркерная',
  both:   '🖊️✏️ Обе',
};

const TYPE_BADGE: Record<string, 'blue' | 'green' | 'purple' | 'yellow'> = {
  standard:    'gray' as any,
  computer:    'blue',
  laboratory:  'green',
  amphitheater:'purple',
};

interface Props {
  classrooms: Classroom[];
  newlyCreatedId: string | null;
  onUpdate: (c: Classroom) => void;
  onDelete: (id: string) => void;
}

export const ClassroomsList: React.FC<Props> = ({
  classrooms,
  newlyCreatedId,
  onUpdate,
  onDelete,
}) => {
  const [selected, setSelected] = useState<Classroom | null>(null);
  const [filterBuilding, setFilterBuilding] = useState('');
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (newlyCreatedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [newlyCreatedId]);

  const buildings = Array.from(new Set(classrooms.map((c) => c.building)));

  const filtered = filterBuilding
    ? classrooms.filter((c) => c.building === filterBuilding)
    : classrooms;

  const buildingLabel = (c: Classroom) =>
    c.building === 'other' ? (c.buildingName ?? 'Другой') : (BUILDING_LABELS[c.building] ?? c.building);

  return (
    <>
      <div className={styles.toolbar}>
        <select
          className={styles.filter}
          value={filterBuilding}
          onChange={(e) => setFilterBuilding(e.target.value)}
        >
          <option value="">Все корпуса</option>
          {buildings.map((b) => (
            <option key={b} value={b}>{BUILDING_LABELS[b] ?? b}</option>
          ))}
        </select>
        <span className={styles.count}>{filtered.length} аудиторий</span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Аудитории не найдены</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Аудитория</th>
                <th>Корпус</th>
                <th>Тип</th>
                <th>Вместимость</th>
                <th>Доска</th>
                <th>Проектор</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  ref={c.id === newlyCreatedId ? highlightRef : null}
                  className={`${styles.row} ${c.id === newlyCreatedId ? styles.highlighted : ''}`}
                  onClick={() => setSelected(c)}
                >
                  <td className={styles.name}>{c.name}</td>
                  <td className={styles.secondary}>{buildingLabel(c)}</td>
                  <td>
                    <Badge variant={TYPE_BADGE[c.type] ?? 'gray'}>
                      {CLASSROOM_TYPE_LABELS[c.type]}
                    </Badge>
                  </td>
                  <td className={styles.secondary}>
                    {c.capacity ? `до ${c.capacity} чел.` : '—'}
                  </td>
                  <td className={styles.secondary}>
                    {c.boardType ? BOARD_LABELS[c.boardType] : '—'}
                  </td>
                  <td className={styles.secondary}>
                    {c.hasProjector === true ? '📽️ Есть' : c.hasProjector === false ? '🚫 Нет' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ClassroomViewModal
          classroom={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => { onUpdate(updated); setSelected(updated); }}
          onDelete={(id) => { onDelete(id); setSelected(null); }}
        />
      )}
    </>
  );
};
