/**
 * Публичный интерфейс совпадает с оригиналом + error, refetch.
 *
 * addGroup/addStream   — server-first, возвращают Promise<boolean>
 * updateGroup/Stream   — оптимистично, откатывают при ошибке + тост
 * removeGroup/Stream   — оптимистично, перезагружают при ошибке + тост
 */
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchGroupsAll,
  updateGroupLocally,
  removeGroupLocally,
  updateStreamLocally,
  removeStreamLocally,
  saveStudentGroupOnServer,
} from '../store/slices/groupsListSlice';
import { fetchSchedules, saveSchedule } from '../store/slices/scheduleSlice';
import { studentGroupApi } from '../api';
import type { Group, Stream } from '../types/group';
import { useToast } from '../components/Toast/ToastContext';
import { extractError } from '../utils/extractError';

export function useGroups() {
  const dispatch = useAppDispatch();
  const { groups, streams, loading, error } = useAppSelector((s) => s.groupsList);
  const { list: scheduleList, selectedScheduleId } = useAppSelector((s) => s.schedule);
  const { addToast } = useToast();
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchSchedules());
  }, [dispatch]);

  useEffect(() => {
    if (selectedScheduleId) dispatch(fetchGroupsAll());
  }, [dispatch, selectedScheduleId]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const refetch = useCallback(() => dispatch(fetchGroupsAll()), [dispatch]);

  const getOrCreateScheduleId = useCallback(async (): Promise<string | null> => {
    if (selectedScheduleId) return selectedScheduleId;
    if (scheduleList.length > 0) return scheduleList[0].id;
    await dispatch(saveSchedule({ name: 'Основное расписание', dateInterval: { dateFrom: '2026-01-01', dateTo: '2026-12-12' } }));
    const updated = await dispatch(fetchSchedules());
    const list = (updated.payload as typeof scheduleList) ?? [];
    return list[0]?.id ?? null;
  }, [selectedScheduleId, scheduleList, dispatch]);

  // ── Группы ──────────────────────────────────────────────────────────────────

  const addGroup = useCallback(
    async (group: Group): Promise<boolean> => {
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return false;
      const stream = streams.find((s) => s.id === group.streamId);
      const result = await dispatch(
        saveStudentGroupOnServer({
          entity: group,
          isNew: true,
          dto: {
            scheduleId,
            name: group.name,
            semesterNumber: stream?.semesterNumber ?? 1,
            studentGroupType: 'Group',
            parentId: group.streamId || null,
          },
        }),
      );
      if (saveStudentGroupOnServer.fulfilled.match(result)) {
        markCreated(group.id);
        return true;
      }
      addToast((result.payload as string) || 'Не удалось создать группу', 'error');
      return false;
    },
    [dispatch, getOrCreateScheduleId, streams, addToast],
  );

  const updateGroup = useCallback(
    async (updated: Group): Promise<boolean> => {
      const original = groups.find((g) => g.id === updated.id);
      dispatch(updateGroupLocally(updated));
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return false;
      const stream = streams.find((s) => s.id === updated.streamId);
      const result = await dispatch(
        saveStudentGroupOnServer({
          entity: updated,
          isNew: false,
          dto: {
            id: updated.id,
            scheduleId,
            name: updated.name,
            semesterNumber: stream?.semesterNumber ?? 1,
            studentGroupType: 'Group',
            parentId: updated.streamId || null,
          },
        }),
      );
      if (saveStudentGroupOnServer.rejected.match(result)) {
        if (original) dispatch(updateGroupLocally(original));
        addToast((result.payload as string) || 'Не удалось сохранить группу', 'error');
        return false;
      }
      return true;
    },
    [dispatch, groups, getOrCreateScheduleId, streams, addToast],
  );

  const removeGroup = useCallback(
    (id: string) => {
      dispatch(removeGroupLocally(id));
      studentGroupApi.deleteStudentGroup({ studentGroupId: id }).catch((err: unknown) => {
        dispatch(fetchGroupsAll());
        addToast(extractError(err), 'error');
      });
    },
    [dispatch, addToast],
  );

  // ── Потоки ──────────────────────────────────────────────────────────────────

  const addStream = useCallback(
    async (stream: Stream): Promise<boolean> => {
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return false;
      const result = await dispatch(
        saveStudentGroupOnServer({
          entity: stream,
          isNew: true,
          dto: {
            scheduleId,
            name: stream.name,
            semesterNumber: stream.semesterNumber ?? 1,
            studentGroupType: 'Thread',
            childIds: stream.groupIds,
          },
        }),
      );
      if (saveStudentGroupOnServer.fulfilled.match(result)) {
        markCreated(stream.id);
        return true;
      }
      addToast((result.payload as string) || 'Не удалось создать поток', 'error');
      return false;
    },
    [dispatch, getOrCreateScheduleId, addToast],
  );

  const updateStream = useCallback(
    async (updated: Stream): Promise<boolean> => {
      const original = streams.find((s) => s.id === updated.id);
      dispatch(updateStreamLocally(updated));
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return false;
      const result = await dispatch(
        saveStudentGroupOnServer({
          entity: updated,
          isNew: false,
          dto: {
            id: updated.id,
            scheduleId,
            name: updated.name,
            semesterNumber: updated.semesterNumber ?? 1,
            studentGroupType: 'Thread',
            childIds: updated.groupIds,
          },
        }),
      );
      if (saveStudentGroupOnServer.rejected.match(result)) {
        if (original) dispatch(updateStreamLocally(original));
        addToast((result.payload as string) || 'Не удалось сохранить поток', 'error');
        return false;
      }
      return true;
    },
    [dispatch, streams, getOrCreateScheduleId, addToast],
  );

  const removeStream = useCallback(
    (id: string) => {
      dispatch(removeStreamLocally(id));
      studentGroupApi.deleteStudentGroup({ studentGroupId: id }).catch((err: unknown) => {
        dispatch(fetchGroupsAll());
        addToast(extractError(err), 'error');
      });
    },
    [dispatch, addToast],
  );

  return {
    groups,
    streams,
    loading,
    error,
    newlyCreatedId,
    addGroup,
    updateGroup,
    removeGroup,
    addStream,
    updateStream,
    removeStream,
    refetch,
  };
}
