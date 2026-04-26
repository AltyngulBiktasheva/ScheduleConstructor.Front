import { useMemo, useCallback } from 'react';
import type { BellSchedule } from '../constants/bellSchedules';

export const BREAK_GAP_PX = 12;

function tMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minsToStr(mins: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, mins));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

export interface BellSlotMetric {
  pairNumber: number;
  timeStart: string;
  timeEnd: string;
  startMin: number;
  endMin: number;
  top: number;    // Y-offset in px
  height: number; // pixel height of this slot
}

/**
 * Хук для bell-режима сетки расписания.
 * Когда schedule === null — возвращает пустые данные (используй useGridMetrics вместо него).
 */
export function useBellMetrics(schedule: BellSchedule | null, hourHeight: number) {
  const slotMetrics = useMemo((): BellSlotMetric[] => {
    if (!schedule) return [];
    let y = 0;
    return schedule.slots.map((slot) => {
      const startMin = tMins(slot.timeStart);
      const endMin = tMins(slot.timeEnd);
      const height = ((endMin - startMin) / 60) * hourHeight;
      const metric: BellSlotMetric = { ...slot, startMin, endMin, top: y, height };
      y += height + BREAK_GAP_PX;
      return metric;
    });
  }, [schedule, hourHeight]);

  const totalHeight = useMemo(() => {
    if (slotMetrics.length === 0) return 0;
    const last = slotMetrics[slotMetrics.length - 1];
    return last.top + last.height;
  }, [slotMetrics]);

  /**
   * Маппинг времени → пиксели.
   * Время внутри слота → линейная интерполяция.
   * Время в перерыве (до старта ближайшего слота) → начало этого слота.
   * Время после всех слотов → totalHeight.
   */
  const timeToPixels = useCallback((time: string): number => {
    const t = tMins(time);
    for (const s of slotMetrics) {
      if (t < s.endMin) {
        if (t <= s.startMin) return s.top;
        return s.top + ((t - s.startMin) / (s.endMin - s.startMin)) * s.height;
      }
    }
    return totalHeight;
  }, [slotMetrics, totalHeight]);

  const durationToPixels = useCallback(
    (start: string, end: string) => timeToPixels(end) - timeToPixels(start),
    [timeToPixels],
  );

  /**
   * Маппинг пиксели → время (для DnD drop).
   * Если попали в промежуток (перерыв) — снапаемся к началу следующего слота.
   */
  const pixelsToTime = useCallback((px: number): string => {
    let rem = px;
    for (let i = 0; i < slotMetrics.length; i++) {
      const s = slotMetrics[i];
      if (rem <= s.height) {
        const mins = s.startMin + Math.round((rem / s.height) * (s.endMin - s.startMin));
        return minsToStr(Math.round(mins / 5) * 5);
      }
      rem -= s.height + BREAK_GAP_PX;
      if (rem < 0) {
        // попали в перерыв — снап к началу следующей пары
        return slotMetrics[i + 1]?.timeStart ?? s.timeEnd;
      }
    }
    return slotMetrics[slotMetrics.length - 1]?.timeEnd ?? '22:00';
  }, [slotMetrics]);

  return { totalHeight, timeToPixels, durationToPixels, pixelsToTime, slotMetrics };
}
