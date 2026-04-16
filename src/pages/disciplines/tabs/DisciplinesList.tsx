import React, { useRef, useEffect, useState } from 'react';
import type { Discipline } from '../../../types';
import { Badge } from '../../../components/Badge/Badge';
import { DisciplineViewModal } from '../modals/DisciplineViewModal';
import { LESSON_TYPE_LABELS } from './RootDisciplineForm';
import styles from './DisciplinesList.module.scss';

interface Props {
  rootDisciplines: Discipline[];
  disciplines: Discipline[];
  newlyCreatedId: string | null;
  onUpdate: (d: Discipline) => void;
  onDelete: (id: string) => void;
}

export const DisciplinesList: React.FC<Props> = ({
  rootDisciplines,
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

  const isEmpty = rootDisciplines.length === 0 && disciplines.length === 0;

  if (isEmpty) {
    return <div className={styles.empty}>Дисциплины не добавлены</div>;
  }

  return (
    <>
      {/* ── Корневые дисциплины ── */}
      {rootDisciplines.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Корневые дисциплины</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Допустимые виды занятий</th>
                </tr>
              </thead>
              <tbody>
                {rootDisciplines.map((d) => (
                  <tr
                    key={d.id}
                    ref={d.id === newlyCreatedId ? highlightRef : null}
                    className={`${styles.row} ${d.id === newlyCreatedId ? styles.highlighted : ''}`}
                    onClick={() => setSelected(d)}
                  >
                    <td>
                      <span className={styles.name}>{d.name}</span>
                    </td>
                    <td>
                      <div className={styles.badges}>
                        {(d.allowedLessonTypes ?? []).map((t) => (
                          <Badge key={t} variant="blue">{LESSON_TYPE_LABELS[t] ?? t}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Обычные дисциплины ── */}
      {disciplines.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Дисциплины</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Вид занятия</th>
                  <th>Часов</th>
                  <th>Группа</th>
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
                      <span className={styles.name}>{d.name}</span>
                    </td>
                    <td>
                      {d.lessonType && (
                        <Badge variant="purple">{LESSON_TYPE_LABELS[d.lessonType] ?? d.lessonType}</Badge>
                      )}
                    </td>
                    <td className={styles.secondary}>
                      {d.totalHoursCount != null ? `${d.totalHoursCount} ч.` : '—'}
                    </td>
                    <td className={styles.secondary}>
                      {d.forIds.length > 0 ? d.forIds.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
