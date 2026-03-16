import type { BuildingType } from '../constants/buildings';

export type RepeatType = 'every-week' | 'once' | 'every-two-weeks' | 'custom';
export type ForType = 'group' | 'stream';

export interface WeeklyOccurrence {
  dayId: string;
  timeStart: string;
  timeEnd: string;
}

export interface DisciplineAudience {
  building: BuildingType;
  buildingName?: string;
  audience?: string;
}

export interface DisciplineTeacher {
  id: string;
  name: string;
}

export interface DisciplineDateRange {
  from: string; // 'DD.MM.YYYY'
  to: string;
}

export interface Discipline {
  id: string;
  name: string;

  forType: ForType;
  forIds: string[];

  teachers: DisciplineTeacher[];
  audiences: DisciplineAudience[];

  isStatic: boolean;
  canOverlap: boolean;

  repeat: RepeatType;
  occurrences?: WeeklyOccurrence[];
  dateRange?: DisciplineDateRange;

  comment?: string;

  // Поля для сетки расписания
  isInGrid?: boolean;
  dayId?: string;
  timeStart?: string;
  timeEnd?: string;
  slotId?: string;
  highlightSlots?: boolean;

  // Устаревшие поля (совместимость с DisciplineCard / EditModal)
  building?: BuildingType;
  buildingName?: string;
  audience?: string;
  teacher?: string;
}

export interface DisciplinePosition {
  disciplineId: string;
  dayId: string;
  timeStart: string;
  timeEnd: string;
  column?: number;
  totalColumns?: number;
}
