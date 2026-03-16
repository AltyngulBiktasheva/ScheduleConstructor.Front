import type { SlotColor } from '../constants/colors';

export interface SlotWarning {
  type: 'yellow' | 'red';
  message: string;
}

export interface GridSlot {
  id: string;
  timeSlotId: string;
  dayId: string;
  color: SlotColor;
  warning?: SlotWarning;
  disciplineId?: string;
}

export interface TimeRange {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface DaySlotConfig {
  dayId: string;
  slots: Array<{
    timeRange: TimeRange;
    color: SlotColor;
    warning?: SlotWarning;
  }>;
}
