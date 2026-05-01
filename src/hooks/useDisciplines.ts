/**
 * Публичный интерфейс: { rootDisciplines, disciplines, newlyCreatedId, add, addRoot, update, remove }
 *
 * Корневые дисциплины → /academic-discipline/save
 * Дочерние (обычные) → /lesson/save
 *
 * scheduleId берётся из store.schedule.selectedScheduleId, либо из первого расписания.
 * Если расписаний нет — создаётся дефолтное.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchDisciplinesAll,
  addDisciplineLocally,
  updateDisciplineLocally,
  removeDisciplineLocally,
  saveDisciplineOnServer,
} from '../store/slices/disciplinesListSlice';
import { saveLesson } from '../store/slices/lessonSlice';
import { academicDisciplineApi } from '../api';
import { fetchSchedules, saveSchedule } from '../store/slices/scheduleSlice';
import type {
  AcademicDisciplinePayloadDto,
  DayOfWeek,
  DisciplineLessonRepeatType,
  LessonBatchInfoDto,
} from '../api';
import type { Discipline } from '../types/discipline';
import type { RootDisciplineFormData } from '../pages/disciplines/tabs/RootDisciplineForm';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** DD.MM.YYYY → YYYY-MM-DD */
function displayToApiDate(display: string): string {
  const [d, m, y] = display.split('.');
  return `${y}-${m}-${d}`;
}

/** HH:MM → HH:MM (уже правильный формат для бэка) */
function padTime(t: string): string {
  return t.length === 5 ? t : '09:00';
}

// ─── Helpers для /academic-discipline/save ────────────────────────────────────

const DAY_ID_TO_DOW: Record<string, DayOfWeek> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
};

function mapRepeatType(repeat: string | undefined): DisciplineLessonRepeatType {
  switch (repeat) {
    case 'even-weeks': return 2; // EvenWeeks
    case 'odd-weeks':  return 3; // OddWeeks
    case 'once':       return 4; // Once
    default:           return 1; // Weekly
  }
}

function buildLessonBatchInfo(
  discipline: Discipline,
  dateInterval: { dateFrom: string; dateTo: string },
): LessonBatchInfoDto {
  return {
    id: discipline.lessonId ?? null,
    studentGroupIds: discipline.forIds,
    teacherId: discipline.teachers[0]?.id ?? null,
    roomId: discipline.roomId ?? null,
    dayOfWeekTimeIntervals: discipline.occurrences?.length
      ? discipline.occurrences.map((occ) => ({
          dayOfWeek: DAY_ID_TO_DOW[occ.dayId] ?? 1,
          timeInterval: { timeFrom: padTime(occ.timeStart), timeTo: padTime(occ.timeEnd) },
        }))
      : null,
    repeatType: mapRepeatType(discipline.repeat),
    dateInterval,
    allowCombining: discipline.canOverlap,
    hoursCost: discipline.totalHoursCount ?? 0,
  };
}

/** Резолвит даты: пользовательские значения имеют приоритет, недостающие берутся из расписания */
function resolveDateInterval(
  dateRange: { from?: string; to?: string } | undefined,
  scheduleDateInterval: { dateFrom: string; dateTo: string } | undefined,
): { dateFrom: string; dateTo: string } {
  const userFrom = dateRange?.from ? displayToApiDate(dateRange.from) : '';
  const userTo   = dateRange?.to   ? displayToApiDate(dateRange.to)   : '';
  return {
    dateFrom: userFrom || scheduleDateInterval?.dateFrom || '',
    dateTo:   userTo   || scheduleDateInterval?.dateTo   || '',
  };
}

/** Если payload null — возвращает дефолтный объект с пустым массивом */
function payloadOrDefault(payload: AcademicDisciplinePayloadDto | null | undefined): AcademicDisciplinePayloadDto {
  return payload ?? { totalHoursCount: 0, lessonBatchInfos: [] };
}

/** Собирает и отправляет /academic-discipline/save для Lecture/Practice/Lab */
async function saveAsPayload(
  discipline: Discipline,
  scheduleId: string,
  rootDisciplines: Discipline[],
  dateInterval: { dateFrom: string; dateTo: string },
): Promise<void> {
  const parentId = (discipline.parentId ?? discipline.academicDisciplineId)!;
  const lessonType = discipline.lessonType!;

  const { data: viewDto } = await academicDisciplineApi.getAcademicDiscipline({
    academicDisciplineId: parentId,
  });
  const root = rootDisciplines.find((r) => r.id === parentId);

  const updatedPayload: AcademicDisciplinePayloadDto = {
    totalHoursCount: discipline.totalHoursCount ?? 0,
    lessonBatchInfos: [buildLessonBatchInfo(discipline, dateInterval)],
  };

  await academicDisciplineApi.saveAcademicDiscipline({
    id: parentId,
    scheduleId,
    name: viewDto.name ?? root?.name,
    cypher: viewDto.cypher ?? undefined,
    semesterNumber: viewDto.semester,
    academicDisciplineTargetType: viewDto.academicDisciplineTargetType,
    allowedLessonTypes: root?.allowedLessonTypes,
    lecturePayload:  lessonType === 'Lecture'  ? updatedPayload : payloadOrDefault(viewDto.lecturePayload),
    practicePayload: lessonType === 'Practice' ? updatedPayload : payloadOrDefault(viewDto.practicePayload),
    labPayload:      lessonType === 'Lab'      ? updatedPayload : payloadOrDefault(viewDto.labPayload),
    comment: viewDto.comment ?? undefined,
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDisciplines() {
  const dispatch = useAppDispatch();
  const { rootDisciplines, disciplines, loading } = useAppSelector((s) => s.disciplinesList);
  const { list: scheduleList, selectedScheduleId } = useAppSelector((s) => s.schedule);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchDisciplinesAll());
    dispatch(fetchSchedules());
  }, [dispatch]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const getOrCreateScheduleId = useCallback(async (): Promise<string | null> => {
    if (selectedScheduleId) return selectedScheduleId;
    if (scheduleList.length > 0) return scheduleList[0].id;
    await dispatch(saveSchedule({ name: 'Основное расписание', dateInterval: { dateFrom: '2025-09-01', dateTo: '2026-01-31' } }));
    const updated = await dispatch(fetchSchedules());
    const list = (updated.payload as typeof scheduleList) ?? [];
    return list[0]?.id ?? null;
  }, [selectedScheduleId, scheduleList, dispatch]);

  // ── Корневая дисциплина ────────────────────────────────────────────────────

  const addRoot = useCallback(
    async (data: RootDisciplineFormData) => {
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;

      const tempDiscipline: Discipline = {
        id: crypto.randomUUID(),
        name: data.name,
        isRoot: true,
        semesterNumber: data.semesterNumber,
        allowedLessonTypes: data.allowedLessonTypes,
        forType: 'group',
        forIds: [],
        teachers: [],
        audiences: [],
        isStatic: false,
        canOverlap: false,
        repeat: 'every-week',
        weeklyCount: 1,
      };

      dispatch(addDisciplineLocally(tempDiscipline));
      markCreated(tempDiscipline.id);

      dispatch(
        saveDisciplineOnServer({
          discipline: tempDiscipline,
          isNew: true,
          dto: {
            scheduleId,
            name: data.name,
            semesterNumber: data.semesterNumber,
            academicDisciplineTargetType: 'General',
            allowedLessonTypes: data.allowedLessonTypes,
          },
        }),
      );
    },
    [dispatch, getOrCreateScheduleId],
  );

  // ── Обычная дисциплина ────────────────────────────────────────────────────

  const add = useCallback(
    async (discipline: Discipline) => {
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;

      const lessonType = discipline.lessonType;

      if (lessonType === 'Lecture' || lessonType === 'Practice' || lessonType === 'Lab') {
        // → /academic-discipline/save: обновляем нужный payload корневой дисциплины
        const selectedSchedule = scheduleList.find((sc) => sc.id === selectedScheduleId);
        const dateInterval = resolveDateInterval(discipline.dateRange, selectedSchedule?.dateInterval);
        await saveAsPayload(discipline, scheduleId, rootDisciplines, dateInterval);
        dispatch(fetchDisciplinesAll());
      } else {
        // Exam / Test → /lesson/save (текущее поведение)
        const occ = discipline.occurrences?.[0];
        const dateFrom = discipline.dateRange?.from
          ? displayToApiDate(discipline.dateRange.from)
          : new Date().toISOString().split('T')[0];

        const dateWithTimeInterval = occ
          ? { date: dateFrom, timeInterval: { timeFrom: padTime(occ.timeStart), timeTo: padTime(occ.timeEnd) } }
          : null;

        const tempId = crypto.randomUUID();
        dispatch(addDisciplineLocally({ ...discipline, id: tempId }));
        markCreated(tempId);

        await dispatch(
          saveLesson({
            scheduleId,
            academicDisciplineId: discipline.parentId,
            academicDisciplineType: discipline.lessonType,
            studentGroupIds: discipline.forIds,
            teacherId: discipline.teachers[0]?.id ?? undefined,
            roomId: discipline.roomId ?? undefined,
            dateWithTimeInterval: dateWithTimeInterval ?? undefined,
            flexibilityType: discipline.isStatic ? 'Fixed' : 'Flexible',
            allowCombining: discipline.canOverlap,
            hoursCost: discipline.totalHoursCount ?? 0,
          }),
        );

        dispatch(fetchDisciplinesAll());
      }
    },
    [dispatch, getOrCreateScheduleId, rootDisciplines],
  );

  // ── Обновление ─────────────────────────────────────────────────────────────

  const update = useCallback(
    async (updated: Discipline) => {
      dispatch(updateDisciplineLocally(updated));
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;

      if (updated.isRoot) {
        dispatch(
          saveDisciplineOnServer({
            discipline: updated,
            isNew: false,
            dto: {
              id: updated.id,
              scheduleId,
              name: updated.name,
              semesterNumber: updated.semesterNumber ?? 1,
              academicDisciplineTargetType: 'General',
              allowedLessonTypes: updated.allowedLessonTypes ?? [],
              lecturePayload:  (updated.allowedLessonTypes ?? []).includes('Lecture')  ? { totalHoursCount: 0 } : undefined,
              practicePayload: (updated.allowedLessonTypes ?? []).includes('Practice') ? { totalHoursCount: 0 } : undefined,
              labPayload:      (updated.allowedLessonTypes ?? []).includes('Lab')      ? { totalHoursCount: 0 } : undefined,
              comment: updated.comment,
            },
          }),
        );
      } else {
        const lessonType = updated.lessonType;

        if (lessonType === 'Lecture' || lessonType === 'Practice' || lessonType === 'Lab') {
          // → /academic-discipline/save
          const selectedSchedule = scheduleList.find((sc) => sc.id === selectedScheduleId);
          const dateInterval = resolveDateInterval(updated.dateRange, selectedSchedule?.dateInterval);
          await saveAsPayload(updated, scheduleId, rootDisciplines, dateInterval);
          dispatch(fetchDisciplinesAll());
        } else {
          // Exam / Test → /lesson/save
          const occ = updated.occurrences?.[0];
          const dateFrom = updated.dateRange?.from
            ? displayToApiDate(updated.dateRange.from)
            : new Date().toISOString().split('T')[0];

          const dateWithTimeInterval = occ
            ? { date: dateFrom, timeInterval: { timeFrom: padTime(occ.timeStart), timeTo: padTime(occ.timeEnd) } }
            : null;

          await dispatch(
            saveLesson({
              id: updated.lessonId ?? undefined,
              scheduleId,
              academicDisciplineId: updated.parentId ?? updated.academicDisciplineId,
              academicDisciplineType: updated.lessonType,
              studentGroupIds: updated.forIds,
              teacherId: updated.teachers[0]?.id ?? undefined,
              roomId: updated.roomId ?? undefined,
              dateWithTimeInterval: dateWithTimeInterval ?? undefined,
              flexibilityType: updated.isStatic ? 'Fixed' : 'Flexible',
              allowCombining: updated.canOverlap,
              hoursCost: updated.totalHoursCount ?? 0,
            }),
          );

          dispatch(fetchDisciplinesAll());
        }
      }
    },
    [dispatch, getOrCreateScheduleId, rootDisciplines],
  );

  // ── Удаление ───────────────────────────────────────────────────────────────

  const remove = useCallback(
    (id: string) => {
      dispatch(removeDisciplineLocally(id));
      void academicDisciplineApi.deleteAcademicDiscipline({ academicDisciplineId: id });
    },
    [dispatch],
  );

  return { rootDisciplines, disciplines, loading, newlyCreatedId, add, addRoot, update, remove };
}
