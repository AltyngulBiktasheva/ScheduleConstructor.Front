import React from 'react';
import type { Discipline } from '../../types';
import { DisciplineCard } from '../DisciplineCard/DisciplineCard';
import styles from './Styles.module.scss';

interface Props {
  disciplines: Discipline[];
  onReturn: (disciplineId: string) => void;
  onDisciplineClick: (discipline: Discipline) => void;
  onToggleHighlight?: (disciplineId: string) => void;
  highlightedDisciplineId?: string | null;
}

export const DisciplineList: React.FC<Props> = ({
  disciplines,
  onReturn,
  onDisciplineClick,
  onToggleHighlight,
  highlightedDisciplineId,
}) => {
  const handleDragStart = (e: React.DragEvent, discipline: Discipline) => {
    e.dataTransfer.setData('disciplineId', discipline.id);
    const duration = discipline.timeStart && discipline.timeEnd
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

  return (
    <div className={styles.container} onDragOver={handleDragOver} onDrop={handleDrop}>
      <h2 className={styles.title}>Дисциплины</h2>
      {disciplines.length === 0 ? (
        <p className={styles.empty}>Все дисциплины размещены</p>
      ) : (
        <div className={styles.list}>
          {disciplines.map((discipline) => (
            <DisciplineCard
              key={discipline.id}
              discipline={discipline}
              isHighlighted={highlightedDisciplineId === discipline.id}
              onDragStart={(e) => handleDragStart(e, discipline)}
              onClick={() => onDisciplineClick(discipline)}
              onToggleHighlight={onToggleHighlight}
            />
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
