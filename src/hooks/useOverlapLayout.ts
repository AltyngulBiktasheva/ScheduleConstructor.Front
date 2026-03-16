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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

export function useOverlapLayout(
  disciplines: Discipline[],
  dayId: string
): PositionedDiscipline[] {
  return useMemo(() => {
    const items = disciplines
      .filter((d) => d.isInGrid && d.dayId === dayId && d.timeStart && d.timeEnd)
      .map((d) => ({
        discipline: d,
        dayId,
        timeStart: d.timeStart!,
        timeEnd: d.timeEnd!,
        start: timeToMinutes(d.timeStart!),
        end: timeToMinutes(d.timeEnd!),
        column: 0,
        totalColumns: 1,
      }));

    // Also handle multi-occurrence disciplines
    const multiItems = disciplines
      .filter((d) => d.occurrences && d.occurrences.length > 0)
      .flatMap((d) =>
        (d.occurrences || [])
          .filter((occ) => occ.dayId === dayId)
          .map((occ) => ({
            discipline: d,
            dayId,
            timeStart: occ.timeStart,
            timeEnd: occ.timeEnd,
            start: timeToMinutes(occ.timeStart),
            end: timeToMinutes(occ.timeEnd),
            column: 0,
            totalColumns: 1,
          }))
      );

    const all = [...items, ...multiItems];

    // Assign columns using greedy interval coloring
    const columns: Array<number> = [];
    all.forEach((item) => {
      const usedCols = all
        .filter(
          (other) =>
            other !== item &&
            overlaps({ start: item.start, end: item.end }, { start: other.start, end: other.end })
        )
        .map((other) => other.column);

      let col = 0;
      while (usedCols.includes(col)) col++;
      item.column = col;
      columns.push(col);
    });

    // const maxCol = columns.length > 0 ? Math.max(...columns) : 0;

    // Compute totalColumns for each group
    all.forEach((item) => {
      const overlappingCols = all
        .filter((other) =>
          overlaps({ start: item.start, end: item.end }, { start: other.start, end: other.end })
        )
        .map((o) => o.column);
      item.totalColumns = Math.max(...overlappingCols) + 1;
    });

    return all.map(({ discipline, dayId, timeStart, timeEnd, column, totalColumns }) => ({
      discipline,
      dayId,
      timeStart,
      timeEnd,
      column,
      totalColumns,
    }));
  }, [disciplines, dayId]);
}
