/**
 * Публичный интерфейс: { classrooms, newlyCreatedId, add, update, remove }
 * Данные хранятся в Redux и синхронизируются с бэкендом.
 *
 * Маппинг: RoomTreeDto → Classroom (via fetchClassroomsAll)
 * При сохранении используется campusId из Classroom.
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
      dispatch(saveClassroomOnServer({ classroom, isNew: true }));
      markCreated(classroom.id);
    },
    [dispatch],
  );

  const update = useCallback(
    (updated: Classroom) => {
      dispatch(updateClassroomLocally(updated));
      dispatch(saveClassroomOnServer({ classroom: updated, isNew: false }));
    },
    [dispatch],
  );

  const remove = useCallback(
    (id: string) => {
      dispatch(removeClassroomLocally(id));
      void roomApi.deleteRoom({ roomId: id });
    },
    [dispatch],
  );

  return { classrooms, loading, newlyCreatedId, add, update, remove };
}
