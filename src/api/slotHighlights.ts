import { academicDisciplineApi } from './api';
import type { AcademicDisciplineType } from './api';

export interface SlotHighlight {
  dayId: string;
  timeStart: string;
  timeEnd: string;
  color: 'green' | 'yellow' | 'red';
  message?: string;
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
}): Promise<SlotHighlight[]> {
  const { data } = await academicDisciplineApi.getWeekConflicts(params);

  return data
    .filter((conflict) => conflict.dayOfWeek in DOW_TO_DAY_ID)
    .map((conflict) => ({
      dayId: DOW_TO_DAY_ID[conflict.dayOfWeek],
      timeStart: conflict.timeInterval.timeFrom.slice(0, 5),
      timeEnd: conflict.timeInterval.timeTo.slice(0, 5),
      color: 'red' as const,
    }));
}
