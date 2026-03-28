/**
 * Заменяет старый локальный хук.
 * Сохраняет тот же публичный интерфейс: { teachers, newlyCreatedId, add, update, remove }
 * Данные теперь хранятся в Redux и загружаются с бэкенда.
 *
 * Маппинг: TeacherViewDto (API) ↔ Teacher (фронтовый тип)
 *   API:   { id, fullname, contacts }
 *   Front: { id, name, wishes }
 *
 * Пожелания (wishes) живут отдельно — teacherPreference slice.
 * Здесь они подставляются как emptyWishes() и могут быть
 * заполнены через useTeacherPreference при открытии карточки.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchTeachersAll,
  addTeacherLocally,
  updateTeacherLocally,
  removeTeacherLocally,
} from '../store/slices/teachersListSlice';
import type { Teacher } from '../types/teacher';

export function useTeachers() {
  const dispatch = useAppDispatch();
  const { teachers, loading } = useAppSelector((s) => s.teachersList);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTeachersAll());
  }, [dispatch]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const add = useCallback(
    (teacher: Teacher) => {
      dispatch(addTeacherLocally(teacher));
      markCreated(teacher.id);
    },
    [dispatch],
  );

  const update = useCallback(
    (updated: Teacher) => {
      dispatch(updateTeacherLocally(updated));
    },
    [dispatch],
  );

  const remove = useCallback(
    (id: string) => {
      dispatch(removeTeacherLocally(id));
    },
    [dispatch],
  );

  return { teachers, loading, newlyCreatedId, add, update, remove };
}
