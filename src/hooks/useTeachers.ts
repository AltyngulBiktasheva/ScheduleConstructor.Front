/**
 * Публичный интерфейс: { teachers, newlyCreatedId, add, update, remove }
 * Данные хранятся в Redux и синхронизируются с бэкендом.
 *
 * Маппинг: TeacherRegistryItemDto (API) ↔ Teacher (фронтовый тип)
 *   API:   { id, fullname, contacts }
 *   Front: { id, name, wishes }
 */
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchTeachersAll,
  addTeacherLocally,
  updateTeacherLocally,
  removeTeacherLocally,
  saveTeacherOnServer,
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
      dispatch(saveTeacherOnServer({ teacher, isNew: true }));
      markCreated(teacher.id);
    },
    [dispatch],
  );

  const update = useCallback(
    (updated: Teacher) => {
      dispatch(updateTeacherLocally(updated));
      dispatch(saveTeacherOnServer({ teacher: updated, isNew: false }));
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
