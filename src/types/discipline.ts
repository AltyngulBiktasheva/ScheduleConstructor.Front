import type { AcademicDisciplineType } from '../api';
import type { BuildingType } from '../constants/buildings';

export type RepeatType = 'every-week' | 'once' | 'even-weeks' | 'odd-weeks';
export type ForType = 'group' | 'stream';

export interface WeeklyOccurrence {
  dayId: string;
  timeStart: string;
  timeEnd: string;
}

export interface DisciplineAudience {
  roomId: string;
  roomName?: string;
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

  // ── Корневая дисциплина (шаблон) ──────────────────────────────────────
  isRoot?: boolean;
  semesterNumber?: number;
  allowedLessonTypes?: AcademicDisciplineType[];

  // ── Дочерняя дисциплина (занятие) ─────────────────────────────────────
  parentId?: string;               // id корневой дисциплины
  lessonType?: AcademicDisciplineType; // тип занятия
  totalHoursCount?: number;        // количество часов

  // ── Связанные сущности ─────────────────────────────────────────────────
  academicDisciplineId?: string;   // UUID академической дисциплины (для дочерних = parentId)
  lessonId?: string;               // UUID урока из lessonBatchInfo (для обновления через /lesson/save)
  roomId?: string;                 // UUID аудитории

  forType: ForType;
  forIds: string[];                // id групп/потоков

  teachers: DisciplineTeacher[];
  audiences: DisciplineAudience[];

  isStatic: boolean;
  canOverlap: boolean;

  repeat: RepeatType;
  // Сколько раз в неделю проводится дисциплина (1–6)
  weeklyCount: number;
  occurrences?: WeeklyOccurrence[];
  dateRange?: DisciplineDateRange;

  comment?: string;

  // ── Поля для сетки расписания ──────────────────────────────────────────
  isInGrid?: boolean;
  dayId?: string;
  timeStart?: string;
  timeEnd?: string;
  slotId?: string;
  highlightSlots?: boolean;

  // ── Уровень ошибок валидации ───────────────────────────────────────────
  errorLevel?: 'Warning' | 'Error' | null;

  // ── Дополнительные копии занятия (для lessonBatchInfos[1..N]) ─────────────
  extraCopies?: Partial<Discipline>[];

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
