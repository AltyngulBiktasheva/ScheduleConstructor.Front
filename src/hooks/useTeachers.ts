/**
 * Публичный интерфейс: { teachers, loading, error, newlyCreatedId, add, update, remove, refetch }
 *
 * add    — server-first: ждёт ответа сервера, возвращает Promise<boolean>
 * update — оптимистично, откатывает при ошибке + показывает тост
 * remove — оптимистично, перезагружает при ошибке + показывает тост
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
import { teacherApi } from '../api';
import type { Teacher } from '../types/teacher';
import { useToast } from '../components/Toast/ToastContext';
import { extractError } from '../utils/extractError';

export function useTeachers() {
  const dispatch = useAppDispatch();
  const { teachers, loading, error } = useAppSelector((s) => s.teachersList);
  const { addToast } = useToast();
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchTeachersAll());
  }, [dispatch]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const refetch = useCallback(() => dispatch(fetchTeachersAll()), [dispatch]);

  /** Создаёт на сервере, возвращает true при успехе */
  const add = useCallback(
    async (teacher: Teacher): Promise<boolean> => {
      const result = await dispatch(saveTeacherOnServer({ teacher, isNew: true }));
      if (saveTeacherOnServer.fulfilled.match(result)) {
        markCreated(teacher.id);
        return true;
      }
      addToast((result.payload as string) || 'Не удалось создать преподавателя', 'error');
      return false;
    },
    [dispatch, addToast],
  );

  /** Оптимистичное обновление с откатом при ошибке */
  const update = useCallback(
    async (updated: Teacher): Promise<boolean> => {
      const original = teachers.find((t) => t.id === updated.id);
      dispatch(updateTeacherLocally(updated));
      const result = await dispatch(saveTeacherOnServer({ teacher: updated, isNew: false }));
      if (saveTeacherOnServer.rejected.match(result)) {
        if (original) dispatch(updateTeacherLocally(original));
        addToast((result.payload as string) || 'Не удалось сохранить изменения', 'error');
        return false;
      }
      return true;
    },
    [dispatch, teachers, addToast],
  );

  /** Оптимистичное удаление с восстановлением при ошибке */
  const remove = useCallback(
    (id: string) => {
      const teacher = teachers.find((t) => t.id === id);
      dispatch(removeTeacherLocally(id));
      teacherApi.deleteTeacher({ teacherId: id }).catch((err: unknown) => {
        if (teacher) dispatch(addTeacherLocally(teacher));
        else dispatch(fetchTeachersAll());
        addToast(extractError(err), 'error');
      });
    },
    [dispatch, teachers, addToast],
  );

  return { teachers, loading, error, newlyCreatedId, add, update, remove, refetch };
}
