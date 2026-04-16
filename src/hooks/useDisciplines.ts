/**
 * Публичный интерфейс: { disciplines, newlyCreatedId, add, addRoot, update, remove }
 * Данные хранятся в Redux и синхронизируются с бэкендом.
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
import { academicDisciplineApi } from '../api';
import { fetchSchedules, saveSchedule } from '../store/slices/scheduleSlice';
import type { Discipline } from '../types/discipline';
import type { RootDisciplineFormData } from '../pages/disciplines/tabs/RootDisciplineForm';

export function useDisciplines() {
  const dispatch = useAppDispatch();
  const { disciplines, loading } = useAppSelector((s) => s.disciplinesList);
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
    // Приоритет: явно выбранное расписание
    if (selectedScheduleId) return selectedScheduleId;
    if (scheduleList.length > 0) return scheduleList[0].id;
    // Создаём дефолтное расписание
    await dispatch(saveSchedule({ name: 'Основное расписание', startsWithEvenWeek: false, startDate: '2025-09-01', endDate: '2026-01-31' }));
    const updated = await dispatch(fetchSchedules());
    const list = (updated.payload as typeof scheduleList) ?? [];
    return list[0]?.id ?? null;
  }, [selectedScheduleId, scheduleList, dispatch]);

  /** Создать корневую дисциплину (шаблон с набором видов занятий) */
  const addRoot = useCallback(
    async (data: RootDisciplineFormData) => {
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;

      const tempDiscipline: Discipline = {
        id: crypto.randomUUID(), // временный — бэк перегенерирует
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

  /** Создать дочернюю дисциплину (конкретное занятие) */
  const add = useCallback(
    async (discipline: Discipline) => {
      dispatch(addDisciplineLocally(discipline));
      markCreated(discipline.id);

      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;

      // Формируем payload для конкретного типа занятия
      const hoursCount = discipline.totalHoursCount ?? 0;
      const payload = hoursCount > 0 ? { totalHoursCount: hoursCount } : null;

      const lessonType = discipline.lessonType;

      dispatch(
        saveDisciplineOnServer({
          discipline,
          isNew: true,
          dto: {
            scheduleId,
            name: discipline.name,
            cypher: discipline.cypher ?? discipline.name,
            semesterNumber: discipline.semesterNumber ?? 1,
            academicDisciplineTargetType: 'General',
            allowedLessonTypes: lessonType ? [lessonType] : [],
            lecturePayload: lessonType === 'Lecture' && payload ? payload : undefined,
            practicePayload: lessonType === 'Practice' && payload ? payload : undefined,
            labPayload: lessonType === 'Lab' && payload ? payload : undefined,
            comment: discipline.comment,
          },
        }),
      );
    },
    [dispatch, getOrCreateScheduleId],
  );

  const update = useCallback(
    async (updated: Discipline) => {
      dispatch(updateDisciplineLocally(updated));
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;

      const hoursCount = updated.totalHoursCount ?? 0;
      const payload = hoursCount > 0 ? { totalHoursCount: hoursCount } : null;
      const lessonType = updated.lessonType;

      if (updated.isRoot) {
        dispatch(
          saveDisciplineOnServer({
            discipline: updated,
            isNew: false,
            dto: {
              id: updated.id,
              scheduleId,
              name: updated.name,
              cypher: updated.cypher ?? updated.name,
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
        dispatch(
          saveDisciplineOnServer({
            discipline: updated,
            isNew: false,
            dto: {
              id: updated.id,
              scheduleId,
              name: updated.name,
              cypher: updated.cypher ?? updated.name,
              semesterNumber: updated.semesterNumber ?? 1,
              academicDisciplineTargetType: 'General',
              allowedLessonTypes: lessonType ? [lessonType] : [],
              lecturePayload: lessonType === 'Lecture' && payload ? payload : undefined,
              practicePayload: lessonType === 'Practice' && payload ? payload : undefined,
              labPayload: lessonType === 'Lab' && payload ? payload : undefined,
              comment: updated.comment,
            },
          }),
        );
      }
    },
    [dispatch, getOrCreateScheduleId],
  );

  const remove = useCallback(
    (id: string) => {
      dispatch(removeDisciplineLocally(id));
      void academicDisciplineApi.deleteAcademicDiscipline({ academicDisciplineId: id });
    },
    [dispatch],
  );

  return { disciplines, loading, newlyCreatedId, add, addRoot, update, remove };
}
