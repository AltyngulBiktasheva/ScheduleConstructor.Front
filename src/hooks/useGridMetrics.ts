import { useMemo } from 'react';

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 22;

export function useGridMetrics(hourHeight: number) {
  const totalMinutes = (GRID_END_HOUR - GRID_START_HOUR) * 60;
  const totalHeight = (GRID_END_HOUR - GRID_START_HOUR) * hourHeight;

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToPixels = (minutes: number): number => {
    const offsetMinutes = minutes - GRID_START_HOUR * 60;
    return (offsetMinutes / totalMinutes) * totalHeight;
  };

  const timeToPixels = (time: string): number => {
    return minutesToPixels(timeToMinutes(time));
  };

  const durationToPixels = (start: string, end: string): number => {
    return timeToPixels(end) - timeToPixels(start);
  };

  const pixelsToTime = (px: number): string => {
    const minutes = Math.round((px / totalHeight) * totalMinutes) + GRID_START_HOUR * 60;
    const clamped = Math.max(GRID_START_HOUR * 60, Math.min(GRID_END_HOUR * 60, minutes));
    const snapped = Math.round(clamped / 15) * 15;
    const h = Math.floor(snapped / 60);
    const m = snapped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const hours = useMemo(() => {
    const result: number[] = [];
    for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h++) {
      result.push(h);
    }
    return result;
  }, []);

  return {
    totalHeight,
    hourHeight,
    timeToPixels,
    durationToPixels,
    pixelsToTime,
    hours,
    gridStartHour: GRID_START_HOUR,
    gridEndHour: GRID_END_HOUR,
  };
}
