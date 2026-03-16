import React from 'react';
import type { Discipline } from '../../types';
import styles from './Styles.module.scss';

interface Props {
  discipline: Discipline;
  isInGrid?: boolean;
  isHighlighted?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
  onToggleHighlight?: (id: string) => void;
}

export const DisciplineCard: React.FC<Props> = ({
  discipline,
  isInGrid = false,
  isHighlighted = false,
  onDragStart,
  onClick,
  onToggleHighlight,
}) => {
  const buildingLabel = {
    turgeneva: 'Тургенева',
    kuybysheva: 'Куйбышева',
    online: 'Онлайн',
    other: discipline.buildingName || 'Другой',
  }[discipline.building || 'other'];

  const handleEyeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleHighlight?.(discipline.id);
  };

  return (
    <div
      className={`${styles.card} ${isInGrid ? styles.inGrid : ''} ${isHighlighted ? styles.highlighted : ''}`}
      draggable={!discipline.isStatic}
      onDragStart={discipline.isStatic ? undefined : onDragStart}
      onClick={onClick}
    >
      {onToggleHighlight && (
        <button
          className={`${styles.eyeBtn} ${isHighlighted ? styles.eyeActive : ''}`}
          onClick={handleEyeClick}
          title={isHighlighted ? 'Скрыть подсветку слотов' : 'Подсветить доступные слоты'}
        >
          {isHighlighted ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}

      {discipline.isStatic && <span className={styles.staticBadge}>С</span>}

      <div className={styles.title}>{discipline.name}</div>

      <div className={styles.details}>
        {discipline.teacher && <div className={styles.detailRow}>{discipline.teacher}</div>}
        <div className={styles.detailRow}>
          {buildingLabel}
          {discipline.audience && `, ауд. ${discipline.audience}`}
        </div>
        {isInGrid && discipline.timeStart && discipline.timeEnd && (
          <div className={styles.time}>
            {discipline.timeStart} – {discipline.timeEnd}
          </div>
        )}
      </div>
    </div>
  );
};

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
