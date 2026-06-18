import type { LessonShortDto } from '../api';
import type { Discipline } from '../types';
import { LESSON_TYPE_LABELS } from '../pages/disciplines/tabs/RootDisciplineForm';

export const DAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function formatDisciplineName(lesson: LessonShortDto): string {
  const base = lesson.academicDisciplineName || 'Занятие';
  const typeLabel = lesson.academicDisciplineType
    ? LESSON_TYPE_LABELS[lesson.academicDisciplineType]
    : undefined;
  return typeLabel ? `${base} (${typeLabel})` : base;
}

export function lessonToDiscipline(lesson: LessonShortDto, weekDates: string[]): Discipline {
  const dt = lesson.dateWithTimeInterval!;
  const dateIdx = weekDates.indexOf(dt.date);
  const dayId = dateIdx >= 0 ? DAY_IDS[dateIdx] : 'mon';
  const rooms = lesson.rooms ?? [];
  const teachers = lesson.teachers ?? [];
  const groups = lesson.studentGroups ?? [];

  return {
    id: lesson.id,
    name: formatDisciplineName(lesson),
    lessonId: lesson.id,
    academicDisciplineId: lesson.academicDisciplineId ?? undefined,
    lessonType: lesson.academicDisciplineType ?? undefined,
    roomIds: rooms.map((r) => r.id),
    forType: 'group',
    forIds: groups.map((g) => g.id),
    forNames: groups.map((g) => g.name ?? ''),
    teachers: teachers.map((t) => ({ id: t.id, name: t.fullname || '' })),
    audiences: rooms.map((r) => ({ roomId: r.id, roomName: r.name ?? undefined })),
    isStatic: lesson.flexibilityType === 'Fixed',
    canOverlap: lesson.allowCombining,
    repeat: 'every-week',
    weeklyCount: 1,
    isInGrid: true,
    dayId,
    timeStart: dt.timeInterval.timeFrom.slice(0, 5),
    timeEnd: dt.timeInterval.timeTo.slice(0, 5),
    errorLevel: lesson.currentErrorsMaxLevel ?? null,
    errorMessage: lesson.lessonPolicyViolationDescription ?? undefined,
    teacher: teachers.map((t) => t.fullname).filter(Boolean).join(', ') || undefined,
    audience: rooms.map((r) => r.name).filter(Boolean).join(', ') || undefined,
    comment: lesson.comment,
  };
}

export function lessonToListDiscipline(lesson: LessonShortDto): Discipline {
  const rooms = lesson.rooms ?? [];
  const teachers = lesson.teachers ?? [];
  const groups = lesson.studentGroups ?? [];

  return {
    id: lesson.id,
    name: formatDisciplineName(lesson),
    lessonId: lesson.id,
    academicDisciplineId: lesson.academicDisciplineId ?? undefined,
    lessonType: lesson.academicDisciplineType ?? undefined,
    roomIds: rooms.map((r) => r.id),
    forType: 'group',
    forIds: groups.map((g) => g.id),
    forNames: groups.map((g) => g.name ?? ''),
    teachers: teachers.map((t) => ({ id: t.id, name: t.fullname || '' })),
    audiences: rooms.map((r) => ({ roomId: r.id, roomName: r.name ?? undefined })),
    isStatic: lesson.flexibilityType === 'Fixed',
    canOverlap: lesson.allowCombining,
    repeat: 'every-week',
    weeklyCount: 1,
    isInGrid: false,
    errorLevel: lesson.currentErrorsMaxLevel ?? null,
    errorMessage: lesson.lessonPolicyViolationDescription ?? undefined,
    teacher: teachers.map((t) => t.fullname).filter(Boolean).join(', ') || undefined,
    audience: rooms.map((r) => r.name).filter(Boolean).join(', ') || undefined,
  };
}
