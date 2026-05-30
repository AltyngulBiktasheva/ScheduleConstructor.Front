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

const LESSON_TYPE_BADGE_VARIANT: Record<string, string> = {
  Lecture: 'blue',
  Practice: 'teal',
  Lab: 'green',
  Test: 'pink',
  Exam: 'purple',
};

export const DisciplinesList: React.FC<Props> = ({
  rootDisciplines,
  disciplines,
  newlyCreatedId,
  onUpdate,
  onDelete,
}) => {
  const [selected, setSelected] = useState<Discipline | null>(null);
  const [filterRootId, setFilterRootId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const highlightRef = useRef<HTMLTableRowElement | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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

  const filteredDisciplines = filteredRoots.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChildDisciplines = filteredChildren.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEmpty = filteredDisciplines.length === 0 && filteredChildDisciplines.length === 0;

  if (rootDisciplines.length === 0 && disciplines.length === 0) {
    return <div className={styles.empty}>Дисциплины не добавлены</div>;
  }

  return (
    <>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск дисциплин..."
        />
        <span className={styles.count}>
          {filteredDisciplines.length + filteredChildDisciplines.length} дисциплин
        </span>
      </div>

      {isEmpty && (
        <div className={styles.empty}>Нет дисциплин, соответствующих фильтру</div>
      )}
      {/* ── Корневые дисциплины ── */}
      {filteredRoots.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Корневые дисциплины</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Альтернативные названия</th>
                  <th>Допустимые виды занятий</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredDisciplines.map((d) => (
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
                      {(d.associatedNames ?? []).length > 0
                        ? <span className={styles.secondary}>{d.associatedNames!.join(', ')}</span>
                        : <span className={styles.secondary}>—</span>}
                    </td>
                    <td>
                      <div className={styles.badges}>
                        {(d.allowedLessonTypes ?? []).map((t) => (
                          <Badge key={t} variant={(LESSON_TYPE_BADGE_VARIANT[t] ?? 'gray') as any}>{LESSON_TYPE_LABELS[t] ?? t}</Badge>
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
      {(filteredChildDisciplines.length > 0 || filterRootId) && (
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
          {filteredChildDisciplines.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Вид занятия</th>
                    <th>Группа</th>
                    <th>Занятий</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChildDisciplines.map((d) => (
                    <React.Fragment key={d.id}>
                      {/* Основная строка */}
                      <tr
                        ref={d.id === newlyCreatedId ? highlightRef : null}
                        className={`${styles.row} ${d.id === newlyCreatedId ? styles.highlighted : ''} ${d.childBatches ? styles.accordionRow : ''}`}
                        onClick={() => setSelected(d)}
                      >
                        <td>
                          {d.childBatches && (
                            <button
                              className={styles.expandBtn}
                              onClick={(e) => { e.stopPropagation(); toggleExpand(d.id); }}
                            >
                              <span className={`${styles.arrow} ${expanded.has(d.id) ? styles.arrowOpen : ''}`}>▶</span>
                            </button>
                          )}
                          <span className={styles.name}>{d.name}</span>
                        </td>
                        <td>
                          {d.lessonType && (
                            <Badge variant={(LESSON_TYPE_BADGE_VARIANT[d.lessonType] ?? 'gray') as any}>{LESSON_TYPE_LABELS[d.lessonType] ?? d.lessonType}</Badge>
                          )}
                        </td>
                        <td className={styles.secondary}>
                          {(d.forNames ?? []).filter(Boolean).length > 0
                            ? d.forNames!.filter(Boolean).join(', ')
                            : d.forIds.length > 0 ? d.forIds.join(', ') : '—'}
                        </td>
                        <td className={styles.secondary}>
                          {d.batchTotal ?? 0}
                        </td>
                      </tr>

                      {/* Дочерние строки (отдельные занятия batch-а) */}
                      {expanded.has(d.id) && d.childBatches?.map((child) => (
                        <tr
                          key={child.id}
                          className={styles.childRow}
                          onClick={() => setSelected(child)}
                        >
                          <td style={{ paddingLeft: 36 }}>
                            <span className={styles.childName}>
                              Занятие {(child.batchIndex ?? 0) + 1}
                            </span>
                          </td>
                          <td></td>
                          <td className={styles.secondary}>
                            {(child.forNames ?? []).filter(Boolean).length > 0
                              ? child.forNames!.filter(Boolean).join(', ')
                              : child.forIds.length > 0 ? child.forIds.join(', ') : '—'}
                          </td>
                          <td></td>
                        </tr>
                      ))}
                    </React.Fragment>
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
