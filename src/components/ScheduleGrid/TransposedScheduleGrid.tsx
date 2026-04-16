import React, { useRef, useState, useCallback, useMemo } from 'react';
import { DAYS } from '../../constants/days';
import { DisciplineCard } from '../DisciplineCard/DisciplineCard';
import type { Discipline } from '../../types';
import type { SlotHighlight } from '../../api/slotHighlights';
import { useGridMetrics } from '../../hooks/useGridMetrics';
import { useOverlapLayout } from '../../hooks/useOverlapLayout';
import styles from './Styles.module.scss';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_COL_WIDTH = 180;
const DAY_LABEL_WIDTH = 40;
const TIME_GUTTER_WIDTH = 64;
const ZOOM_LEVELS = [40, 60, 80, 100, 130];
const DEFAULT_ZOOM_INDEX = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

/** Один столбец транспонированной сетки (одна группа/поток) */
export interface GridColumn {
  id: string;
  /** Отображаемое название в заголовке */
  label: string;
  /** Список конкретных id групп/подгрупп для фильтрации d.forIds */
  filterIds: string[];
}

interface Props {
  disciplines: Discipline[];
  columns: GridColumn[];
  highlights?: SlotHighlight[];
  onMove?: (disciplineId: string, dayId: string, timeStart: string, timeEnd: string) => void;
  onDisciplineClick?: (discipline: Discipline) => void;
  onToggleHighlight?: (disciplineId: string) => void;
  highlightedDisciplineId?: string | null;
  loadingHighlightId?: string | null;
  weekOffset?: number;
  onWeekOffsetChange?: (offset: number) => void;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function tMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minsToTime(minutes: number): string {
  const clamped = Math.max(8 * 60, Math.min(22 * 60, minutes));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

/** Вычисляет максимальное кол-во параллельных колонок без хуков */
function pureMaxCols(discs: Discipline[], dayId: string): number {
  const items = discs
    .filter((d) => d.isInGrid && d.dayId === dayId && d.timeStart && d.timeEnd)
    .map((d) => ({ s: tMins(d.timeStart!), e: tMins(d.timeEnd!), col: 0 }));

  if (items.length === 0) return 1;

  items.forEach((item, i) => {
    const used = items
      .filter((o, j) => j !== i && o.s < item.e && item.s < o.e)
      .map((o) => o.col);
    let c = 0;
    while (used.includes(c)) c++;
    item.col = c;
  });

  return Math.max(...items.map((i) => i.col)) + 1;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const TransposedScheduleGrid: React.FC<Props> = ({
  disciplines,
  columns,
  highlights = [],
  onMove,
  onDisciplineClick,
  onToggleHighlight,
  highlightedDisciplineId,
  loadingHighlightId,
  weekOffset = 0,
  onWeekOffsetChange,
}) => {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ disciplineId: string; offsetY: number } | null>(null);

  const hourHeight = ZOOM_LEVELS[zoomIndex];
  const { totalHeight, timeToPixels, durationToPixels, pixelsToTime, hours } =
    useGridMetrics(hourHeight);

  // Дисциплины, отфильтрованные под каждый столбец
  const colDisciplines = useMemo(
    () =>
      columns.map((col) =>
        disciplines.filter((d) => col.filterIds.some((id) => d.forIds.includes(id))),
      ),
    [disciplines, columns],
  );

  // Ширина каждого столбца = BASE_COL_WIDTH * max(maxCols за все дни)
  const colWidths = useMemo(
    () =>
      colDisciplines.map((discs) =>
        BASE_COL_WIDTH * Math.max(1, ...DAYS.map((day) => pureMaxCols(discs, day.id))),
      ),
    [colDisciplines],
  );

  const getWeekLabel = () => {
    const now = new Date();
    const dow = now.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff + weekOffset * 7);
    const sat = new Date(mon);
    sat.setDate(mon.getDate() + 5);
    const fmt = (d: Date) =>
      String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
    return fmt(mon) + ' – ' + fmt(sat);
  };

  // ─── DnD ─────────────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent, disc: Discipline, occ?: { timeStart: string; timeEnd: string }) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      dragInfo.current = { disciplineId: disc.id, offsetY: e.clientY - rect.top };
      e.dataTransfer.setData('disciplineId', disc.id);
      e.dataTransfer.setData(
        'duration',
        String(
          tMins(occ?.timeEnd || disc.timeEnd || '10:30') -
            tMins(occ?.timeStart || disc.timeStart || '09:00'),
        ),
      );
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dayId: string) => {
      e.preventDefault();
      const disciplineId = e.dataTransfer.getData('disciplineId');
      const duration = parseInt(e.dataTransfer.getData('duration') || '90', 10);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const scrollTop = scrollRef.current?.scrollTop || 0;
      const relY = e.clientY - rect.top + scrollTop - (dragInfo.current?.offsetY || 0);
      const rawStart = pixelsToTime(relY);
      const startMin = tMins(rawStart);
      onMove?.(disciplineId, dayId, minsToTime(startMin), minsToTime(startMin + duration));
      dragInfo.current = null;
    },
    [pixelsToTime, onMove],
  );

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>
      {/* Toolbar — идентичен обычной сетке */}
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
            onClick={() => setZoomIndex((i) => Math.max(i - 1, 0))}
            disabled={zoomIndex === 0}
            title="Уменьшить"
          >
            <MinusIcon />
          </button>
          <span className={styles.zoomLabel}>
            {Math.round((ZOOM_LEVELS[zoomIndex] / 80) * 100)}%
          </span>
          <button
            className={styles.zoomBtn}
            onClick={() => setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1))}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            title="Увеличить"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Прокручиваемая область */}
      <div className={styles.gridOuter} ref={scrollRef}>
        <div className={styles.tGridInner}>

          {/* Заголовок: угол + названия групп */}
          <div className={styles.tHeader}>
            <div
              className={styles.tCorner}
              style={{ width: DAY_LABEL_WIDTH + TIME_GUTTER_WIDTH }}
            />
            {columns.map((col, i) => (
              <div
                key={col.id}
                className={styles.tGroupHeader}
                style={{ width: colWidths[i], minWidth: colWidths[i] }}
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Строки по дням */}
          {DAYS.map((day) => (
            <div key={day.id} className={styles.tDayRow}>

              {/* Метка дня (повёрнута на 90°, прилипает к левому краю) */}
              <div
                className={styles.tDayLabel}
                style={{ width: DAY_LABEL_WIDTH, height: totalHeight }}
              >
                <span className={styles.tDayText}>{day.name}</span>
              </div>

              {/* Временна́я шкала (прилипает следом за меткой дня) */}
              <div
                className={styles.tTimeGutter}
                style={{ width: TIME_GUTTER_WIDTH, height: totalHeight, left: DAY_LABEL_WIDTH }}
              >
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

              {/* Ячейки по группам */}
              {columns.map((col, i) => (
                <TransposedGroupCell
                  key={col.id}
                  dayId={day.id}
                  disciplines={colDisciplines[i]}
                  highlights={highlights}
                  highlightedDisciplineId={highlightedDisciplineId}
                  loadingHighlightId={loadingHighlightId}
                  totalHeight={totalHeight}
                  colWidth={colWidths[i]}
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
          ))}

        </div>
      </div>
    </div>
  );
};

// ─── TransposedGroupCell ─────────────────────────────────────────────────────

interface GroupCellProps {
  dayId: string;
  disciplines: Discipline[];
  highlights: SlotHighlight[];
  highlightedDisciplineId?: string | null;
  loadingHighlightId?: string | null;
  totalHeight: number;
  colWidth: number;
  hours: number[];
  timeToPixels: (t: string) => number;
  durationToPixels: (s: string, e: string) => number;
  onDrop: (e: React.DragEvent, dayId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, d: Discipline, occ?: { timeStart: string; timeEnd: string }) => void;
  onDisciplineClick?: (d: Discipline) => void;
  onToggleHighlight?: (id: string) => void;
}

const TransposedGroupCell: React.FC<GroupCellProps> = ({
  dayId,
  disciplines,
  highlights,
  highlightedDisciplineId,
  loadingHighlightId,
  totalHeight,
  colWidth,
  hours,
  timeToPixels,
  durationToPixels,
  onDrop,
  onDragOver,
  onDragStart,
  onDisciplineClick,
  onToggleHighlight,
}) => {
  const { positioned } = useOverlapLayout(disciplines, dayId);
  const dayHighlights = highlights.filter((h) => h.dayId === dayId);

  return (
    <div
      className={styles.tGroupCell}
      style={{ height: totalHeight, width: colWidth, minWidth: colWidth }}
      onDrop={(e) => onDrop(e, dayId)}
      onDragOver={onDragOver}
    >
      {/* Часовые линии */}
      {hours.map((h) => (
        <div
          key={h}
          className={styles.hourLine}
          style={{ top: timeToPixels(`${String(h).padStart(2, '0')}:00`) }}
        />
      ))}

      {/* Подсветки конфликтных слотов */}
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

      {/* Карточки занятий */}
      {positioned.map(({ discipline, timeStart, timeEnd, column }) => {
        const top = timeToPixels(timeStart);
        const height = Math.max(durationToPixels(timeStart, timeEnd), 28);
        const left = column * BASE_COL_WIDTH;

        const isOnYellowSlot = dayHighlights.some(
          (hl) =>
            hl.color === 'yellow' &&
            tMins(hl.timeStart) < tMins(timeEnd) &&
            tMins(hl.timeEnd) > tMins(timeStart),
        );

        return (
          <div
            key={`${discipline.id}-${timeStart}`}
            className={styles.cardWrapper}
            style={{ top, height, left, width: BASE_COL_WIDTH }}
          >
            <DisciplineCard
              discipline={discipline}
              isInGrid
              isOnYellowSlot={isOnYellowSlot}
              isHighlightActive={highlightedDisciplineId === discipline.id}
              isLoadingHighlight={loadingHighlightId === discipline.id}
              onDragStart={(e) => onDragStart(e, discipline, { timeStart, timeEnd })}
              onClick={() => onDisciplineClick?.(discipline)}
              onToggleHighlight={discipline.isStatic ? undefined : onToggleHighlight}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─── Icons (same as ScheduleGrid) ────────────────────────────────────────────

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
