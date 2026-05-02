/**
 * Публичный интерфейс совпадает с оригиналом.
 * Данные хранятся в Redux и синхронизируются с бэкендом.
 *
 * scheduleId для сохранения берётся из store.schedule.list[0].id.
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
  saveStudentGroupOnServer,
} from '../store/slices/groupsListSlice';
import { fetchSchedules, saveSchedule } from '../store/slices/scheduleSlice';
import { studentGroupApi } from '../api';
import type { Group, Stream } from '../types/group';

export function useGroups() {
  const dispatch = useAppDispatch();
  const { groups, streams, loading } = useAppSelector((s) => s.groupsList);
  const { list: scheduleList, selectedScheduleId } = useAppSelector((s) => s.schedule);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  // Сначала загружаем список расписаний (чтобы получить selectedScheduleId)
  useEffect(() => {
    dispatch(fetchSchedules());
  }, [dispatch]);

  // Загружаем группы только после того, как известен selectedScheduleId
  useEffect(() => {
    if (selectedScheduleId) dispatch(fetchGroupsAll());
  }, [dispatch, selectedScheduleId]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const getOrCreateScheduleId = useCallback(async (): Promise<string | null> => {
    if (selectedScheduleId) return selectedScheduleId;
    if (scheduleList.length > 0) return scheduleList[0].id;
    await dispatch(saveSchedule({ name: 'Основное расписание', dateInterval: { dateFrom: '2026-01-01', dateTo: '2026-12-12' } }));
    const updated = await dispatch(fetchSchedules());
    const list = (updated.payload as typeof scheduleList) ?? [];
    return list[0]?.id ?? null;
  }, [selectedScheduleId, scheduleList, dispatch]);

  const addGroup = useCallback(
    async (group: Group) => {
      dispatch(addGroupLocally(group));
      markCreated(group.id);
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;
      const stream = streams.find((s) => s.id === group.streamId);
      dispatch(
        saveStudentGroupOnServer({
          entity: group,
          isNew: true,
          dto: {
            scheduleId,
            name: group.name,
            semesterNumber: stream?.semesterNumber ?? 1,
            studentGroupType: 'Group',
            cypher: '00.00.00',
            parentId: group.streamId || null,
          },
        }),
      );
    },
    [dispatch, getOrCreateScheduleId, streams],
  );

  const updateGroup = useCallback(
    async (updated: Group) => {
      dispatch(updateGroupLocally(updated));
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;
      const stream = streams.find((s) => s.id === updated.streamId);
      dispatch(
        saveStudentGroupOnServer({
          entity: updated,
          isNew: false,
          dto: {
            id: updated.id,
            scheduleId,
            name: updated.name,
            semesterNumber: stream?.semesterNumber ?? 1,
            studentGroupType: 'Group',
            cypher: '00.00.00',
            parentId: updated.streamId || null,
          },
        }),
      );
    },
    [dispatch, getOrCreateScheduleId, streams],
  );

  const removeGroup = useCallback(
    (id: string) => {
      dispatch(removeGroupLocally(id));
      void studentGroupApi.deleteStudentGroup({ studentGroupId: id });
    },
    [dispatch],
  );

  const addStream = useCallback(
    async (stream: Stream) => {
      dispatch(addStreamLocally(stream));
      markCreated(stream.id);
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;
      dispatch(
        saveStudentGroupOnServer({
          entity: stream,
          isNew: true,
          dto: {
            scheduleId,
            name: stream.name,
            semesterNumber: stream.semesterNumber ?? 1,
            studentGroupType: 'Thread',
            cypher: '00.00.00',
            childIds: stream.groupIds,
          },
        }),
      );
    },
    [dispatch, getOrCreateScheduleId],
  );

  const updateStream = useCallback(
    async (updated: Stream) => {
      dispatch(updateStreamLocally(updated));
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return;
      dispatch(
        saveStudentGroupOnServer({
          entity: updated,
          isNew: false,
          dto: {
            id: updated.id,
            scheduleId,
            name: updated.name,
            semesterNumber: updated.semesterNumber ?? 1,
            studentGroupType: 'Thread',
            cypher: '00.00.00',
            childIds: updated.groupIds,
          },
        }),
      );
    },
    [dispatch, getOrCreateScheduleId],
  );

  const removeStream = useCallback(
    (id: string) => {
      dispatch(removeStreamLocally(id));
      void studentGroupApi.deleteStudentGroup({ studentGroupId: id });
    },
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
