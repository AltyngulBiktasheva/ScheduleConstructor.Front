/**
 * Публичный интерфейс: { disciplines, newlyCreatedId, add, update, remove }
 * Данные хранятся в Redux и синхронизируются с бэкендом.
 *
 * scheduleId для сохранения берётся из store.schedule.list[0].id.
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
import { fetchSchedules, saveSchedule } from '../store/slices/scheduleSlice';
import type { Discipline } from '../types/discipline';

export function useDisciplines() {
  const dispatch = useAppDispatch();
  const { disciplines, loading } = useAppSelector((s) => s.disciplinesList);
  const scheduleList = useAppSelector((s) => s.schedule.list);
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
    if (scheduleList.length > 0) return scheduleList[0].id;
    // Создаём дефолтное расписание
    const id = crypto.randomUUID();
    await dispatch(saveSchedule({ id, name: 'Основное расписание' }));
    const updated = await dispatch(fetchSchedules());
    const list = (updated.payload as typeof scheduleList) ?? [];
    return list[0]?.id ?? null;
  }, [scheduleList, dispatch]);

  const add = useCallback(
    async (discipline: Discipline) => {
      dispatch(addDisciplineLocally(discipline));
      markCreated(discipline.id);
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;
      dispatch(
        saveDisciplineOnServer({
          discipline,
          dto: {
            id: discipline.id,
            scheduleId,
            name: discipline.name,
            cypher: discipline.id,
            semesterNumber: 1,
            academicDisciplineTargetType: 'General',
            allowedLessonTypes: [],
            hasExam: false,
            hasTest: false,
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
      dispatch(
        saveDisciplineOnServer({
          discipline: updated,
          dto: {
            id: updated.id,
            scheduleId,
            name: updated.name,
            cypher: updated.id,
            semesterNumber: 1,
            academicDisciplineTargetType: 'General',
            allowedLessonTypes: [],
            hasExam: false,
            hasTest: false,
            comment: updated.comment,
          },
        }),
      );
    },
    [dispatch, getOrCreateScheduleId],
  );

  const remove = useCallback(
    (id: string) => {
      dispatch(removeDisciplineLocally(id));
    },
    [dispatch],
  );

  return { disciplines, loading, newlyCreatedId, add, update, remove };
}
