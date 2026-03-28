/**
 * Заменяет старый локальный хук.
 * Публичный интерфейс: { classrooms, newlyCreatedId, add, update, remove }
 *
 * Маппинг: RoomViewDto (API) ↔ Classroom (фронтовый тип)
 *   API:   { id, name, campusId, roomType }
 *   Front: { id, name, building, type, capacity, boardType, hasProjector }
 *
 * Примечание: API не возвращает capacity/boardType/hasProjector —
 * эти поля устанавливаются в дефолт при получении с сервера.
 * При создании (add) все поля доступны из формы.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchClassroomsAll,
  addClassroomLocally,
  updateClassroomLocally,
  removeClassroomLocally,
} from '../store/slices/classroomsListSlice';
import type { Classroom } from '../types/classroom';

export function useClassrooms() {
  const dispatch = useAppDispatch();
  const { classrooms, loading } = useAppSelector((s) => s.classroomsList);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchClassroomsAll());
  }, [dispatch]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const add = useCallback(
    (classroom: Classroom) => {
      dispatch(addClassroomLocally(classroom));
      markCreated(classroom.id);
    },
    [dispatch],
  );

  const update = useCallback(
    (updated: Classroom) => {
      dispatch(updateClassroomLocally(updated));
    },
    [dispatch],
  );

  const remove = useCallback(
    (id: string) => {
      dispatch(removeClassroomLocally(id));
    },
    [dispatch],
  );

  return { classrooms, loading, newlyCreatedId, add, update, remove };
}
