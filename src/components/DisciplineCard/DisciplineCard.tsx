import React from 'react';
import type { Discipline } from '../../types';
import styles from './Styles.module.scss';

interface Props {
  discipline: Discipline;
  isInGrid?: boolean;
  // Карточка на желтом слоте — подсвечиваем только в этом случае
  isOnYellowSlot?: boolean;
  // Кнопка-глазок активна (подсветка включена)
  isHighlightActive?: boolean;
  // Идёт запрос к бэку
  isLoadingHighlight?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
  onToggleHighlight?: (id: string) => void;
}

export const DisciplineCard: React.FC<Props> = ({
  discipline,
  isInGrid = false,
  isOnYellowSlot = false,
  isHighlightActive = false,
  isLoadingHighlight = false,
  onDragStart,
  onClick,
  onToggleHighlight,
}) => {
  const buildingLabel = ({
    turgeneva: 'Тургенева',
    kuybysheva: 'Куйбышева',
    online: 'Онлайн',
    other: discipline.buildingName || 'Другой',
  } as Record<string, string>)[discipline.building || 'other'];

  const isDraggable = !discipline.isStatic && !!onDragStart;

  const handleEyeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleHighlight?.(discipline.id);
  };

  return (
    <div
      className={[
        styles.card,
        isInGrid ? styles.inGrid : '',
        isOnYellowSlot ? styles.onYellowSlot : '',
        discipline.isStatic ? styles.isStatic : '',
        discipline.errorLevel === 'Warning' ? styles.errorWarning : '',
        discipline.errorLevel === 'Error' ? styles.errorError : '',
        discipline.lessonType && !discipline.errorLevel ? styles[`type${discipline.lessonType}`] : '',
      ].filter(Boolean).join(' ')}
      draggable={isDraggable}
      onDragStart={isDraggable ? onDragStart : undefined}
      onClick={onClick}
      title={discipline.errorMessage || undefined}
    >
      {onToggleHighlight && (
        <button
          className={[styles.eyeBtn, isHighlightActive ? styles.eyeActive : ''].filter(Boolean).join(' ')}
          onClick={handleEyeClick}
          disabled={isLoadingHighlight}
          title={isHighlightActive ? 'Скрыть подсветку слотов' : 'Подсветить доступные слоты'}
        >
          {isLoadingHighlight ? <SpinnerIcon /> : isHighlightActive ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}

      {discipline.isStatic && <span className={styles.staticBadge}>С</span>}

      <div className={styles.title}>
        {discipline.name}
        {(discipline.batchTotal ?? 0) > 1 && (
          <span className={styles.batchNumber}> (Занятие {(discipline.batchIndex ?? 0) + 1})</span>
        )}
      </div>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          {discipline.teacher || 'Без преподавателя'}
        </div>
        <div className={styles.detailRow}>
          {buildingLabel ? `${buildingLabel}, ` : ''}
          {discipline.audience || 'Без аудитории'}
        </div>
        {discipline.timeStart && discipline.timeEnd && (
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

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.spinner}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);
