/**
 * Заменяет старый локальный хук.
 * Публичный интерфейс полностью совпадает с оригиналом.
 *
 * Маппинг: StudentGroupViewDto (API) ↔ Group/Stream (фронтовые типы)
 *   API не разделяет Group и Stream — все группы плоские.
 *   Логика разделения на потоки/группы делается на фронте через parentId.
 *   StudentGroupType.Thread → Stream, Group/SemiGroup → Group.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchGroupsAll,
  addGroupLocally,
  updateGroupLocally,
  removeGroupLocally,
  addStreamLocally,
  updateStreamLocally,
  removeStreamLocally,
} from '../store/slices/groupsListSlice';
import type { Group, Stream } from '../types/group';

export function useGroups() {
  const dispatch = useAppDispatch();
  const { groups, streams, loading } = useAppSelector((s) => s.groupsList);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchGroupsAll());
  }, [dispatch]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const addGroup = useCallback(
    (group: Group) => {
      dispatch(addGroupLocally(group));
      markCreated(group.id);
    },
    [dispatch],
  );

  const updateGroup = useCallback(
    (updated: Group) => dispatch(updateGroupLocally(updated)),
    [dispatch],
  );

  const removeGroup = useCallback(
    (id: string) => dispatch(removeGroupLocally(id)),
    [dispatch],
  );

  const addStream = useCallback(
    (stream: Stream) => {
      dispatch(addStreamLocally(stream));
      markCreated(stream.id);
    },
    [dispatch],
  );

  const updateStream = useCallback(
    (updated: Stream) => dispatch(updateStreamLocally(updated)),
    [dispatch],
  );

  const removeStream = useCallback(
    (id: string) => dispatch(removeStreamLocally(id)),
    [dispatch],
  );

  return {
    groups,
    streams,
    loading,
    newlyCreatedId,
    addGroup,
    updateGroup,
    removeGroup,
    addStream,
    updateStream,
    removeStream,
  };
}
