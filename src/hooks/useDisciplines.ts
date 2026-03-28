/**
 * Заменяет старый локальный хук.
 * Публичный интерфейс: { disciplines, newlyCreatedId, add, update, remove }
 *
 * Маппинг: AcademicDisciplineViewDto (API) ↔ Discipline (фронтовый тип)
 *   Фронтовый тип богаче — поля расписания (dayId, timeStart и т.д.)
 *   не приходят из этого endpoint и остаются undefined после загрузки.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchDisciplinesAll,
  addDisciplineLocally,
  updateDisciplineLocally,
  removeDisciplineLocally,
} from '../store/slices/disciplinesListSlice';
import type { Discipline } from '../types/discipline';

export function useDisciplines() {
  const dispatch = useAppDispatch();
  const { disciplines, loading } = useAppSelector((s) => s.disciplinesList);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchDisciplinesAll());
  }, [dispatch]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const add = useCallback(
    (discipline: Discipline) => {
      dispatch(addDisciplineLocally(discipline));
      markCreated(discipline.id);
    },
    [dispatch],
  );

  const update = useCallback(
    (updated: Discipline) => {
      dispatch(updateDisciplineLocally(updated));
    },
    [dispatch],
  );

  const remove = useCallback(
    (id: string) => {
      dispatch(removeDisciplineLocally(id));
    },
    [dispatch],
  );

  return { disciplines, loading, newlyCreatedId, add, update, remove };
}
