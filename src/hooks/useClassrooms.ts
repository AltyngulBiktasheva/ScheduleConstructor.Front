/**
 * Публичный интерфейс: { classrooms, loading, error, newlyCreatedId, add, update, remove, refetch }
 * Данные хранятся в Redux и синхронизируются с бэкендом.
 *
 * add    — server-first: ждёт ответа сервера, возвращает Promise<boolean>
 * update — оптимистично, откатывает при ошибке + показывает тост
 * remove — оптимистично, перезагружает при ошибке + показывает тост
 */
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchClassroomsAll,
  addClassroomLocally,
  updateClassroomLocally,
  removeClassroomLocally,
  saveClassroomOnServer,
} from '../store/slices/classroomsListSlice';
import { roomApi } from '../api';
import type { Classroom } from '../types/classroom';
import { useToast } from '../components/Toast/ToastContext';
import { extractError } from '../utils/extractError';

export function useClassrooms() {
  const dispatch = useAppDispatch();
  const { classrooms, loading, error } = useAppSelector((s) => s.classroomsList);
  const { addToast } = useToast();
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchClassroomsAll());
  }, [dispatch]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const refetch = useCallback(() => dispatch(fetchClassroomsAll()), [dispatch]);

  /** Создаёт на сервере, возвращает true при успехе */
  const add = useCallback(
    async (classroom: Classroom): Promise<boolean> => {
      const result = await dispatch(saveClassroomOnServer({ classroom, isNew: true }));
      if (saveClassroomOnServer.fulfilled.match(result)) {
        markCreated(classroom.id);
        return true;
      }
      addToast((result.payload as string) || 'Не удалось создать аудиторию', 'error');
      return false;
    },
    [dispatch, addToast],
  );

  /** Оптимистичное обновление с откатом при ошибке */
  const update = useCallback(
    async (updated: Classroom): Promise<boolean> => {
      const original = classrooms.find((c) => c.id === updated.id);
      dispatch(updateClassroomLocally(updated));
      const result = await dispatch(saveClassroomOnServer({ classroom: updated, isNew: false }));
      if (saveClassroomOnServer.rejected.match(result)) {
        if (original) dispatch(updateClassroomLocally(original));
        addToast((result.payload as string) || 'Не удалось сохранить изменения', 'error');
        return false;
      }
      return true;
    },
    [dispatch, classrooms, addToast],
  );

  /** Оптимистичное удаление с восстановлением при ошибке */
  const remove = useCallback(
    (id: string) => {
      const classroom = classrooms.find((c) => c.id === id);
      dispatch(removeClassroomLocally(id));
      roomApi.deleteRoom({ roomId: id }).catch((err: unknown) => {
        if (classroom) dispatch(addClassroomLocally(classroom));
        else dispatch(fetchClassroomsAll());
        addToast(extractError(err), 'error');
      });
    },
    [dispatch, classrooms, addToast],
  );

  return { classrooms, loading, error, newlyCreatedId, add, update, remove, refetch };
}
