import React from 'react';
import type { Discipline } from '../../types';
import type { DisciplineSection } from '../MainContainer/MainContainer';
import { DisciplineCard } from '../DisciplineCard/DisciplineCard';
import styles from './Styles.module.scss';

interface Props {
  sections: DisciplineSection[];
  onReturn: (disciplineId: string) => void;
  onDisciplineClick: (discipline: Discipline) => void;
  onToggleHighlight?: (disciplineId: string) => void;
  highlightedDisciplineId?: string | null;
  loadingHighlightId?: string | null;
}

export const DisciplineList: React.FC<Props> = ({
  sections,
  onReturn,
  onDisciplineClick,
  onToggleHighlight,
  highlightedDisciplineId,
  loadingHighlightId,
}) => {
  const handleDragStart = (e: React.DragEvent, discipline: Discipline) => {
    if (discipline.isStatic) return;
    e.dataTransfer.setData('disciplineId', discipline.id);
    const duration =
      discipline.timeStart && discipline.timeEnd
        ? String(timeToMinutes(discipline.timeEnd) - timeToMinutes(discipline.timeStart))
        : '90';
    e.dataTransfer.setData('duration', duration);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const disciplineId = e.dataTransfer.getData('disciplineId');
    onReturn(disciplineId);
  };

  const totalDisciplines = sections.reduce((sum, s) => sum + s.disciplines.length, 0);
  const hasMultipleSections = sections.length > 1 || (sections.length === 1 && sections[0].label !== '');

  return (
    <div className={styles.container} onDragOver={handleDragOver} onDrop={handleDrop} data-tour="discipline-list">
      <h2 className={styles.title}>Дисциплины</h2>
      {totalDisciplines === 0 ? (
        <p className={styles.empty}>Все дисциплины размещены</p>
      ) : (
        <div className={styles.list}>
          {sections.map((section) => (
            <React.Fragment key={section.label || '__default'}>
              {hasMultipleSections && section.label && (
                <h3 className={styles.sectionTitle}>{section.label}</h3>
              )}
              {section.disciplines.map((discipline) => (
                <DisciplineCard
                  key={discipline.id}
                  discipline={discipline}
                  isHighlightActive={highlightedDisciplineId === discipline.id}
                  isLoadingHighlight={loadingHighlightId === discipline.id}
                  onDragStart={(e) => handleDragStart(e, discipline)}
                  onClick={() => onDisciplineClick(discipline)}
                  onToggleHighlight={discipline.isStatic ? undefined : onToggleHighlight}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
