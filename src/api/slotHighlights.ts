import { academicDisciplineApi } from './api';
import type { AcademicDisciplineType } from './api';

export interface SlotHighlightMessage {
  timeStart: string;
  timeEnd: string;
  message: string;
}

export interface SlotHighlight {
  dayId: string;
  timeStart: string;
  timeEnd: string;
  color: 'yellow' | 'red';
  messages: SlotHighlightMessage[];
}

// C# DayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const DOW_TO_DAY_ID: Record<number, string> = {
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

export async function fetchSlotHighlights(params: {
  academicDisciplineId: string;
  academicDisciplineType: AcademicDisciplineType;
  lessonBatchInfoId?: string;
}): Promise<SlotHighlight[]> {
  const { data } = await academicDisciplineApi.getWeekConflicts(params);

  return data
    .filter((c) => c.dayOfWeekTimeInterval.dayOfWeek in DOW_TO_DAY_ID)
    .map((c) => ({
      dayId: DOW_TO_DAY_ID[c.dayOfWeekTimeInterval.dayOfWeek],
      timeStart: c.dayOfWeekTimeInterval.timeInterval.timeFrom.slice(0, 5),
      timeEnd: c.dayOfWeekTimeInterval.timeInterval.timeTo.slice(0, 5),
      color: c.errorType === 'Warning' ? 'yellow' as const : 'red' as const,
      messages: c.messages.map((m) => ({
        timeStart: m.timeInterval.timeFrom.slice(0, 5),
        timeEnd: m.timeInterval.timeTo.slice(0, 5),
        message: m.message,
      })),
    }));
}
