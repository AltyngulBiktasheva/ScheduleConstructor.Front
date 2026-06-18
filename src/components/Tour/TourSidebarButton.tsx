import React from 'react';
import { useTour } from './TourProvider';
import styles from './TourSidebarButton.module.scss';

interface Props {
  isOpen: boolean;
}

export const TourSidebarButton: React.FC<Props> = ({ isOpen }) => {
  const { state, tourStatus, startTour, resumeTour } = useTour();

  const compilerStatus = tourStatus('compiler');
  const teacherStatus = tourStatus('teacher');

  const isInProgress = compilerStatus === 'in-progress' || teacherStatus === 'in-progress';
  const allDone = (compilerStatus === 'completed' || compilerStatus === 'skipped') &&
                  (teacherStatus === 'completed' || teacherStatus === 'skipped');

  const label = isInProgress
    ? 'Продолжить тур'
    : allDone
      ? 'Пройти тур заново'
      : 'Ознакомительный тур';

  const handleClick = () => {
    if (state.phase === 'deviation' || state.phase === 'paused') {
      resumeTour();
    } else {
      startTour(compilerStatus === 'in-progress' ? 'compiler' : teacherStatus === 'in-progress' ? 'teacher' : 'compiler');
    }
  };

  return (
    <button
      className={`${styles.button} ${!isOpen ? styles.collapsed : ''}`}
      onClick={handleClick}
      title={!isOpen ? label : undefined}
    >
      <span className={styles.icon}>
        <PlayIcon />
      </span>
      {isOpen && <span className={styles.label}>{label}</span>}
    </button>
  );
};

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="6,3 20,12 6,21" />
  </svg>
);
