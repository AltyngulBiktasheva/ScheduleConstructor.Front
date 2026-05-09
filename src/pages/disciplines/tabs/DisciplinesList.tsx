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
  const [filterRootId, setFilterRootId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (newlyCreatedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [newlyCreatedId]);

  const filteredRoots = filterRootId
    ? rootDisciplines.filter((d) => d.id === filterRootId)
    : rootDisciplines;

  const filteredChildren = filterRootId
    ? disciplines.filter(
        (d) => d.parentId === filterRootId || d.academicDisciplineId === filterRootId,
      )
    : disciplines;

  const isEmpty = filteredRoots.length === 0 && filteredChildren.length === 0;

  if (rootDisciplines.length === 0 && disciplines.length === 0) {
    return <div className={styles.empty}>Дисциплины не добавлены</div>;
  }

  if (isEmpty) {
    return <div className={styles.empty}>Нет дисциплин, соответствующих фильтру</div>;
  }

  return (
    <>
      {/* ── Корневые дисциплины ── */}
      {filteredRoots.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Корневые дисциплины</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Допустимые виды занятий</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRoots.map((d) => (
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
                    <td>
                      <button
                        className={`${styles.filterBtn} ${filterRootId === d.id ? styles.filterBtnActive : ''}`}
                        title={filterRootId === d.id ? 'Показать все' : 'Показать только эту дисциплину'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilterRootId(filterRootId === d.id ? null : d.id);
                        }}
                      >
                        👁
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Обычные дисциплины ── */}
      {(filteredChildren.length > 0 || filterRootId) && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Дисциплины</h3>
          {filterRootId && (
            <div className={styles.filterBadge}>
              <span>
                Фильтр: {rootDisciplines.find((d) => d.id === filterRootId)?.name}
              </span>
              <button onClick={() => setFilterRootId(null)}>✕</button>
            </div>
          )}
          {filteredChildren.length > 0 ? (
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
                  {filteredChildren.map((d) => (
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
          ) : (
            <div className={styles.emptySection}>Нет дочерних дисциплин</div>
          )}
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
