import { useMemo } from 'react';
import type { Discipline } from '../types';

export interface PositionedDiscipline {
  discipline: Discipline;
  dayId: string;
  timeStart: string;
  timeEnd: string;
  column: number;
  totalColumns: number;
}

export interface OverlapLayoutResult {
  positioned: PositionedDiscipline[];
  maxColumns: number;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

export function useOverlapLayout(disciplines: Discipline[], dayId: string): OverlapLayoutResult {
  return useMemo(() => {
    const items: Array<{
      discipline: Discipline;
      dayId: string;
      timeStart: string;
      timeEnd: string;
      start: number;
      end: number;
      column: number;
      totalColumns: number;
    }> = [];

    disciplines
      .filter((d) => d.isInGrid && d.dayId === dayId && d.timeStart && d.timeEnd)
      .forEach((d) => {
        items.push({
          discipline: d, dayId,
          timeStart: d.timeStart!, timeEnd: d.timeEnd!,
          start: timeToMinutes(d.timeStart!), end: timeToMinutes(d.timeEnd!),
          column: 0, totalColumns: 1,
        });
      });

    disciplines
      .filter((d) => d.occurrences && d.occurrences.length > 0)
      .forEach((d) => {
        (d.occurrences || []).filter((occ) => occ.dayId === dayId).forEach((occ) => {
          items.push({
            discipline: d, dayId,
            timeStart: occ.timeStart, timeEnd: occ.timeEnd,
            start: timeToMinutes(occ.timeStart), end: timeToMinutes(occ.timeEnd),
            column: 0, totalColumns: 1,
          });
        });
      });

    if (items.length === 0) return { positioned: [], maxColumns: 1 };

    // Greedy interval coloring
    items.forEach((item) => {
      const usedCols = items
        .filter((o) => o !== item && overlaps({ start: item.start, end: item.end }, { start: o.start, end: o.end }))
        .map((o) => o.column);
      let col = 0;
      while (usedCols.includes(col)) col++;
      item.column = col;
    });

    items.forEach((item) => {
      const cols = items
        .filter((o) => overlaps({ start: item.start, end: item.end }, { start: o.start, end: o.end }))
        .map((o) => o.column);
      item.totalColumns = Math.max(...cols) + 1;
    });

    const maxColumns = Math.max(...items.map((i) => i.totalColumns));

    return {
      positioned: items.map(({ discipline, dayId, timeStart, timeEnd, column, totalColumns }) => ({
        discipline, dayId, timeStart, timeEnd, column, totalColumns,
      })),
      maxColumns,
    };
  }, [disciplines, dayId]);
}
