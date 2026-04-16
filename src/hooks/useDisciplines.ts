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
    await dispatch(saveSchedule({ name: 'Основное расписание', startsWithEvenWeek: false, startDate: '2025-09-01', endDate: '2026-01-31' }));
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
        cypher: data.cypher,
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
            cypher: data.cypher,
            semesterNumber: data.semesterNumber,
            academicDisciplineTargetType: 'General',
            allowedLessonTypes: data.allowedLessonTypes,
          },
        }),
      );
    },
    [dispatch, getOrCreateScheduleId],
  );

  // ── Обычная дисциплина (занятие) — /lesson/save ────────────────────────────

  const add = useCallback(
    async (discipline: Discipline) => {
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;

      // Определяем дату начала и время из первого occurrence (если статичная)
      const occ = discipline.occurrences?.[0];
      const dateFrom = discipline.dateRange?.from
        ? displayToApiDate(discipline.dateRange.from)
        : new Date().toISOString().split('T')[0];

      const dateWithTimeInterval = occ
        ? {
            date: dateFrom,
            timeInterval: {
              timeFrom: padTime(occ.timeStart),
              timeTo: padTime(occ.timeEnd),
            },
          }
        : null;

      const tempId = crypto.randomUUID();
      const tempDiscipline: Discipline = { ...discipline, id: tempId };
      dispatch(addDisciplineLocally(tempDiscipline));
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

      // Перезагружаем список, чтобы получить реальный ID с бэка
      dispatch(fetchDisciplinesAll());
    },
    [dispatch, getOrCreateScheduleId],
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
              cypher: updated.cypher ?? '00.00.00',
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
        const occ = updated.occurrences?.[0];
        const dateFrom = updated.dateRange?.from
          ? displayToApiDate(updated.dateRange.from)
          : new Date().toISOString().split('T')[0];

        const dateWithTimeInterval = occ
          ? {
              date: dateFrom,
              timeInterval: {
                timeFrom: padTime(occ.timeStart),
                timeTo: padTime(occ.timeEnd),
              },
            }
          : null;

        await dispatch(
          saveLesson({
            // lessonId = реальный ID занятия из lessonBatchInfo
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
    },
    [dispatch, getOrCreateScheduleId],
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
