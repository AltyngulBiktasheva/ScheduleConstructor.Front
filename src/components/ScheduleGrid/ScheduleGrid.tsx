import React, { useRef, useState, useCallback } from 'react';
import { DAYS } from '../../constants/days';
import { DisciplineCard } from '../DisciplineCard/DisciplineCard';
import type { Discipline } from '../../types';
import { useGridMetrics } from '../../hooks/useGridMetrics';
import { useOverlapLayout } from '../../hooks/useOverlapLayout';
import styles from './Styles.module.scss';

interface SlotHighlight {
  dayId: string;
  timeStart: string;
  timeEnd: string;
  color: 'green' | 'yellow' | 'red';
  message?: string;
}

interface Props {
  disciplines: Discipline[];
  highlights?: SlotHighlight[];
  onMove?: (disciplineId: string, dayId: string, timeStart: string, timeEnd: string) => void;
  onDisciplineClick?: (discipline: Discipline) => void;
  onToggleHighlight?: (disciplineId: string) => void;
  highlightedDisciplineId?: string | null;
  weekOffset?: number;
  onWeekOffsetChange?: (offset: number) => void;
}

const ZOOM_LEVELS = [40, 60, 80, 100, 130];
const DEFAULT_ZOOM_INDEX = 2;

export const ScheduleGrid: React.FC<Props> = ({
  disciplines,
  highlights = [],
  onMove,
  onDisciplineClick,
  onToggleHighlight,
  highlightedDisciplineId,
  weekOffset = 0,
  onWeekOffsetChange,
}) => {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ disciplineId: string; offsetY: number } | null>(null);

  const hourHeight = ZOOM_LEVELS[zoomIndex];
  const { totalHeight, timeToPixels, durationToPixels, pixelsToTime, hours } =
    useGridMetrics(hourHeight);

  const handleZoomIn = () => setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1));
  const handleZoomOut = () => setZoomIndex((i) => Math.max(i - 1, 0));

  const handleDragStart = useCallback(
    (e: React.DragEvent, discipline: Discipline, occ?: { timeStart: string; timeEnd: string }) => {
      const cardEl = e.currentTarget as HTMLElement;
      const rect = cardEl.getBoundingClientRect();
      dragInfo.current = {
        disciplineId: discipline.id,
        offsetY: e.clientY - rect.top,
      };
      e.dataTransfer.setData('disciplineId', discipline.id);
      e.dataTransfer.setData(
        'duration',
        String(
          timeToMinutesLocal(occ?.timeEnd || discipline.timeEnd || '10:30') -
            timeToMinutesLocal(occ?.timeStart || discipline.timeStart || '09:00')
        )
      );
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dayId: string) => {
      e.preventDefault();
      const disciplineId = e.dataTransfer.getData('disciplineId');
      const duration = parseInt(e.dataTransfer.getData('duration') || '90', 10);

      const colEl = e.currentTarget as HTMLElement;
      const rect = colEl.getBoundingClientRect();
      const scrollTop = scrollRef.current?.scrollTop || 0;
      const relativeY = e.clientY - rect.top + scrollTop - (dragInfo.current?.offsetY || 0);

      const rawStart = pixelsToTime(relativeY);
      const startMinutes = timeToMinutesLocal(rawStart);
      const endMinutes = startMinutes + duration;
      const timeStart = minutesToTimeLocal(startMinutes);
      const timeEnd = minutesToTimeLocal(endMinutes);

      onMove?.(disciplineId, dayId, timeStart, timeEnd);
      dragInfo.current = null;
    },
    [pixelsToTime, onMove]
  );

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const getWeekLabel = () => {
    if (weekOffset === 0) return 'Текущая неделя';
    if (weekOffset > 0) return `+${weekOffset} нед.`;
    return `${weekOffset} нед.`;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.weekNav}>
          <button
            className={styles.navBtn}
            onClick={() => onWeekOffsetChange?.(weekOffset - 1)}
            title="Предыдущая неделя"
          >
            <ChevronLeft />
          </button>
          <span className={styles.weekLabel}>{getWeekLabel()}</span>
          <button
            className={styles.navBtn}
            onClick={() => onWeekOffsetChange?.(weekOffset + 1)}
            title="Следующая неделя"
          >
            <ChevronRight />
          </button>
          {weekOffset !== 0 && (
            <button className={styles.todayBtn} onClick={() => onWeekOffsetChange?.(0)}>
                Текущая неделя
            </button>
          )}
        </div>

        <div className={styles.zoomControls}>
          <button
            className={styles.zoomBtn}
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
            title="Уменьшить"
          >
            <MinusIcon />
          </button>
          <span className={styles.zoomLabel}>{Math.round((ZOOM_LEVELS[zoomIndex] / 80) * 100)}%</span>
          <button
            className={styles.zoomBtn}
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            title="Увеличить"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      <div className={styles.gridOuter} ref={scrollRef}>
        <div className={styles.gridInner}>
          {/* Header row */}
          <div className={styles.header}>
            <div className={styles.timeGutter} />
            {DAYS.map((day) => (
              <div key={day.id} className={styles.dayHeader}>
                <span className={styles.dayName}>{day.name}</span>
                <span className={styles.dayShort}>{day.shortName}</span>
              </div>
            ))}
          </div>

          {/* Body */}
          <div className={styles.body}>
            {/* Time gutter */}
            <div className={styles.timeGutter} style={{ height: totalHeight }}>
              {hours.map((h) => (
                <div
                  key={h}
                  className={styles.hourLabel}
                  style={{ top: timeToPixels(`${String(h).padStart(2, '0')}:00`) }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((day) => (
              <DayColumn
                key={day.id}
                dayId={day.id}
                disciplines={disciplines}
                highlights={highlights}
                highlightedDisciplineId={highlightedDisciplineId}
                totalHeight={totalHeight}
                hourHeight={hourHeight}
                hours={hours}
                timeToPixels={timeToPixels}
                durationToPixels={durationToPixels}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                onDisciplineClick={onDisciplineClick}
                onToggleHighlight={onToggleHighlight}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DayColumn ───────────────────────────────────────────────────────────────

interface DayColumnProps {
  dayId: string;
  disciplines: Discipline[];
  highlights: SlotHighlight[];
  highlightedDisciplineId?: string | null;
  totalHeight: number;
  hourHeight: number;
  hours: number[];
  timeToPixels: (t: string) => number;
  durationToPixels: (s: string, e: string) => number;
  onDrop: (e: React.DragEvent, dayId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, d: Discipline, occ?: { timeStart: string; timeEnd: string }) => void;
  onDisciplineClick?: (d: Discipline) => void;
  onToggleHighlight?: (id: string) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  dayId,
  disciplines,
  highlights,
  highlightedDisciplineId,
  totalHeight,
  // hourHeight,
  hours,
  timeToPixels,
  durationToPixels,
  onDrop,
  onDragOver,
  onDragStart,
  onDisciplineClick,
  onToggleHighlight,
}) => {
  const positioned = useOverlapLayout(disciplines, dayId);
  const dayHighlights = highlights.filter((h) => h.dayId === dayId);

  return (
    <div
      className={styles.dayColumn}
      style={{ height: totalHeight }}
      onDrop={(e) => onDrop(e, dayId)}
      onDragOver={onDragOver}
    >
      {/* Hour grid lines */}
      {hours.map((h) => (
        <div
          key={h}
          className={styles.hourLine}
          style={{ top: timeToPixels(`${String(h).padStart(2, '0')}:00`) }}
        />
      ))}

      {/* Highlight regions */}
      {dayHighlights.map((hl, i) => {
        const top = timeToPixels(hl.timeStart);
        const height = durationToPixels(hl.timeStart, hl.timeEnd);
        return (
          <div
            key={i}
            className={`${styles.highlight} ${styles[`highlight_${hl.color}`]}`}
            style={{ top, height }}
            title={hl.message}
          />
        );
      })}

      {/* Discipline cards */}
      {positioned.map(({ discipline, timeStart, timeEnd, column, totalColumns }) => {
        const top = timeToPixels(timeStart);
        const height = Math.max(durationToPixels(timeStart, timeEnd), 28);
        const widthPct = 100 / totalColumns;
        const leftPct = widthPct * column;

        return (
          <div
            key={`${discipline.id}-${timeStart}`}
            className={styles.cardWrapper}
            style={{
              top,
              height,
              left: `${leftPct}%`,
              width: `${widthPct}%`,
            }}
          >
            <DisciplineCard
              discipline={discipline}
              isInGrid
              isHighlighted={highlightedDisciplineId === discipline.id}
              onDragStart={(e) => onDragStart(e, discipline, { timeStart, timeEnd })}
              onClick={() => onDisciplineClick?.(discipline)}
              onToggleHighlight={onToggleHighlight}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMinutesLocal(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeLocal(minutes: number): string {
  const clamped = Math.max(8 * 60, Math.min(22 * 60, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
