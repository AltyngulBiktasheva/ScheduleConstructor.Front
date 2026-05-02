import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ScheduleGrid } from '../ScheduleGrid/ScheduleGrid';
import { TransposedScheduleGrid } from '../ScheduleGrid/TransposedScheduleGrid';
import type { GridColumn } from '../ScheduleGrid/TransposedScheduleGrid';
import { DisciplineList } from '../DisciplineList/DisciplineList';
import { EditModal } from '../EditModal/EditModal';
import type { Discipline } from '../../types';
import type { SlotHighlight } from '../../api/slotHighlights';
import { fetchSlotHighlights } from '../../api/slotHighlights';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchWeekLessons, saveLesson, deleteWeekLesson } from '../../store/slices/lessonSlice';
import { fetchDisciplinesAll } from '../../store/slices/disciplinesListSlice';
import { fetchGroupsAll } from '../../store/slices/groupsListSlice';
import type { LessonWeekItemDto, AcademicDisciplineType } from '../../api';
import styles from './Styles.module.scss';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SliceSelection {
  type: 'classrooms' | 'teachers' | 'groups';
  entityId: string | string[];
  label: string;
}

interface Props {
  selection: SliceSelection;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDates(weekOffset: number): string[] {
  const now = new Date();
  const dow = now.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function lessonToDiscipline(lesson: LessonWeekItemDto, weekDates: string[]): Discipline {
  const dateIdx = weekDates.indexOf(lesson.dateWithTimeInterval.date);
  const dayId = dateIdx >= 0 ? DAY_IDS[dateIdx] : 'mon';

  return {
    id: lesson.id,
    name: lesson.name || 'Занятие',
    academicDisciplineId: lesson.academicDisciplineId ?? undefined,
    lessonType: lesson.academicDisciplineType ?? undefined,
    roomId: lesson.roomId ?? undefined,
    forType: 'group',
    forIds: lesson.studentGroups.map((g) => g.id),
    teachers: lesson.teacherId
      ? [{ id: lesson.teacherId, name: lesson.teacherName || '' }]
      : [],
    audiences: lesson.roomId
      ? [{ roomId: lesson.roomId, roomName: lesson.roomName ?? undefined }]
      : [],
    isStatic: lesson.flexibilityType === 'Fixed',
    canOverlap: lesson.allowCombining,
    repeat: 'every-week',
    weeklyCount: 1,
    isInGrid: true,
    dayId,
    timeStart: lesson.dateWithTimeInterval.timeInterval.timeFrom.slice(0, 5),
    timeEnd: lesson.dateWithTimeInterval.timeInterval.timeTo.slice(0, 5),
    errorLevel: lesson.currentErrorsMaxLevel ?? null,
    teacher: lesson.teacherName ?? undefined,
    audience: lesson.roomName ?? undefined,
  };
}

function filterLessonsByEntity(
  lessons: LessonWeekItemDto[],
  selection: SliceSelection,
): LessonWeekItemDto[] {
  const ids = Array.isArray(selection.entityId)
    ? selection.entityId
    : [selection.entityId];

  return lessons.filter((lesson) => {
    if (selection.type === 'classrooms') return ids.includes(lesson.roomId ?? '');
    if (selection.type === 'teachers') return ids.includes(lesson.teacherId ?? '');
    if (selection.type === 'groups') return lesson.studentGroups.some((g) => ids.includes(g.id));
    return false;
  });
}

function padTime(t: string): string {
  // Оставляем только HH:MM, отрезая секунды если они есть
  return t.slice(0, 5);
}

// ─── Component ───────────────────────────────────────────────────────────────

export const MainContainer: React.FC<Props> = ({ selection }) => {
  const dispatch = useAppDispatch();
  const { weekLessons, weekLessonsLoading } = useAppSelector((s) => s.lesson);
  const rootDisciplineList = useAppSelector((s) => s.disciplinesList.rootDisciplines);
  const childDisciplineList = useAppSelector((s) => s.disciplinesList.disciplines);
  const listDisciplines = useMemo(
    () => [...rootDisciplineList, ...childDisciplineList],
    [rootDisciplineList, childDisciplineList],
  );
  const selectedScheduleId = useAppSelector((s) => s.schedule.selectedScheduleId);
  const scheduleStartDate = useAppSelector((s) =>
    s.schedule.list.find((sc) => sc.id === s.schedule.selectedScheduleId)?.dateInterval.dateFrom ?? null
  );
  const { groups, streams } = useAppSelector((s) => s.groupsList);

  // Транспонированный режим: несколько групп выбрано
  const isTransposed =
    selection.type === 'groups' &&
    Array.isArray(selection.entityId) &&
    selection.entityId.length > 1;

  const [weekOffset, setWeekOffset] = useState(0);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [loadingHighlightId, setLoadingHighlightId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<SlotHighlight[]>([]);

  // ── Загрузка занятий недели ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedScheduleId) return;
    const weekDates = getWeekDates(weekOffset);
    dispatch(fetchWeekLessons({
      scheduleId: selectedScheduleId,
      dateFrom: weekDates[0],
      dateTo: weekDates[5],
    }));
  }, [dispatch, selectedScheduleId, weekOffset]);

  // ── Загрузка дисциплин для списка ────────────────────────────────────────
  useEffect(() => {
    if (listDisciplines.length === 0) dispatch(fetchDisciplinesAll());
  }, [dispatch, listDisciplines.length]);

  // ── Загрузка групп для транспонированного режима ──────────────────────────
  useEffect(() => {
    if (isTransposed && groups.length === 0) dispatch(fetchGroupsAll());
  }, [dispatch, isTransposed, groups.length]);

  // ── Фильтрация занятий по сущности ───────────────────────────────────────
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const entityLessons = filterLessonsByEntity(weekLessons, selection);
  const gridDisciplines = entityLessons.map((l) => lessonToDiscipline(l, weekDates));

  // Дисциплины для списка — только не-корневые (листовые)
  const listItems = listDisciplines.filter((d) => !d.isRoot);

  // ── Столбцы для транспонированной сетки ──────────────────────────────────
  const gridColumns = useMemo((): GridColumn[] => {
    if (!isTransposed) return [];
    const ids = selection.entityId as string[];

    return ids.map((entityId) => {
      // Поток → filterIds = все группы и подгруппы потока
      const stream = streams.find((s) => s.id === entityId);
      if (stream) {
        const filterIds = stream.groupIds.flatMap((gid) => {
          const g = groups.find((g) => g.id === gid);
          return g ? [gid, ...g.subgroups.map((s) => s.id)] : [gid];
        });
        return { id: entityId, label: stream.name, filterIds };
      }

      // Группа → filterIds = группа + подгруппы
      const group = groups.find((g) => g.id === entityId);
      if (group) {
        return {
          id: entityId,
          label: group.name,
          filterIds: [entityId, ...group.subgroups.map((s) => s.id)],
        };
      }

      // Подгруппа → ищем в дочерних списках
      for (const g of groups) {
        const sub = g.subgroups.find((s) => s.id === entityId);
        if (sub) return { id: entityId, label: sub.name, filterIds: [entityId] };
      }

      return { id: entityId, label: entityId, filterIds: [entityId] };
    });
  }, [isTransposed, selection.entityId, streams, groups]);

  // ── Перезагрузка после сохранения / удаления ─────────────────────────────
  const refetchWeek = useCallback(() => {
    if (!selectedScheduleId) return;
    const dates = getWeekDates(weekOffset);
    dispatch(fetchWeekLessons({
      scheduleId: selectedScheduleId,
      dateFrom: dates[0],
      dateTo: dates[5],
    }));
  }, [dispatch, selectedScheduleId, weekOffset]);

  // ── DnD: перемещение / создание занятия ──────────────────────────────────
  const handleDisciplineMove = useCallback(
    async (disciplineId: string, dayId: string, timeStart: string, timeEnd: string) => {
      if (!selectedScheduleId) return;

      const dates = getWeekDates(weekOffset);
      const dayIdx = DAY_IDS.indexOf(dayId as typeof DAY_IDS[number]);
      const date = dates[dayIdx] ?? dates[0];

      const existingLesson = weekLessons.find((l) => l.id === disciplineId);

      if (existingLesson) {
        // Перемещаем существующее занятие
        if (existingLesson.flexibilityType === 'Fixed') return;
        await dispatch(saveLesson({
          id: existingLesson.id,
          scheduleId: selectedScheduleId,
          academicDisciplineId: existingLesson.academicDisciplineId,
          academicDisciplineType: existingLesson.academicDisciplineType,
          studentGroupIds: existingLesson.studentGroups.map((g) => g.id),
          teacherId: existingLesson.teacherId,
          roomId: existingLesson.roomId,
          dateWithTimeInterval: {
            date,
            timeInterval: { timeFrom: padTime(timeStart), timeTo: padTime(timeEnd) },
          },
          flexibilityType: existingLesson.flexibilityType,
          allowCombining: existingLesson.allowCombining,
          hoursCost: 2,
        }));
      } else {
        // Создаём новое занятие из дисциплины в списке
        const listDiscipline = listDisciplines.find((d) => d.id === disciplineId);
        if (!listDiscipline) return;

        const groupIds = selection.type === 'groups'
          ? (Array.isArray(selection.entityId) ? selection.entityId : [selection.entityId])
          : listDiscipline.forIds;

        await dispatch(saveLesson({
          scheduleId: selectedScheduleId,
          academicDisciplineId: listDiscipline.academicDisciplineId ?? listDiscipline.parentId,
          academicDisciplineType: listDiscipline.lessonType,
          studentGroupIds: groupIds,
          teacherId: listDiscipline.teachers[0]?.id ?? undefined,
          roomId: selection.type === 'classrooms'
            ? (selection.entityId as string)
            : undefined,
          dateWithTimeInterval: {
            date,
            timeInterval: { timeFrom: padTime(timeStart), timeTo: padTime(timeEnd) },
          },
          flexibilityType: 'Flexible',
          allowCombining: false,
          hoursCost: listDiscipline.totalHoursCount ?? 2,
        }));
      }

      refetchWeek();
    },
    [dispatch, selectedScheduleId, weekOffset, weekLessons, listDisciplines, selection, refetchWeek],
  );

  // ── DnD: возврат занятия в список (удаление) ─────────────────────────────
  const handleDisciplineReturn = useCallback(
    async (disciplineId: string) => {
      if (!selectedScheduleId) return;
      const lesson = weekLessons.find((l) => l.id === disciplineId);
      if (!lesson || lesson.flexibilityType === 'Fixed') return;

      await dispatch(deleteWeekLesson({ scheduleId: selectedScheduleId, lessonId: disciplineId }));
    },
    [dispatch, selectedScheduleId, weekLessons],
  );

  // ── Клик на карточку → открыть модалку ───────────────────────────────────
  const handleDisciplineClick = useCallback((discipline: Discipline) => {
    setEditingDiscipline(discipline);
  }, []);

  // ── Сохранение из EditModal → POST /lesson/save ───────────────────────────
  const handleSaveDiscipline = useCallback(
    async (updated: Discipline) => {
      if (!selectedScheduleId) return;

      const lesson = weekLessons.find((l) => l.id === updated.id);
      if (!lesson) {
        setEditingDiscipline(null);
        return;
      }

      const date = updated.dayId
        ? weekDates[DAY_IDS.indexOf(updated.dayId as typeof DAY_IDS[number])] ?? weekDates[0]
        : lesson.dateWithTimeInterval.date;

      await dispatch(saveLesson({
        id: lesson.id,
        scheduleId: selectedScheduleId,
        academicDisciplineId: lesson.academicDisciplineId,
        academicDisciplineType: lesson.academicDisciplineType,
        studentGroupIds: lesson.studentGroups.map((g) => g.id),
        teacherId: updated.teachers?.[0]?.id ?? lesson.teacherId,
        roomId: updated.roomId ?? lesson.roomId,
        dateWithTimeInterval: {
          date,
          timeInterval: {
            timeFrom: padTime(updated.timeStart ?? lesson.dateWithTimeInterval.timeInterval.timeFrom.slice(0, 5)),
            timeTo: padTime(updated.timeEnd ?? lesson.dateWithTimeInterval.timeInterval.timeTo.slice(0, 5)),
          },
        },
        flexibilityType: lesson.flexibilityType,
        allowCombining: lesson.allowCombining,
        hoursCost: 2,
      }));

      setEditingDiscipline(null);
      refetchWeek();
    },
    [dispatch, selectedScheduleId, weekLessons, weekDates, refetchWeek],
  );

  // ── Eye icon → week-conflicts → highlights ────────────────────────────────
  const handleToggleHighlight = useCallback(async (disciplineId: string) => {
    if (highlightedId === disciplineId) {
      setHighlightedId(null);
      setHighlights([]);
      return;
    }

    const discipline = gridDisciplines.find((d) => d.id === disciplineId);
    if (!discipline?.academicDisciplineId || !discipline.lessonType) return;

    setLoadingHighlightId(disciplineId);
    setHighlightedId(null);
    setHighlights([]);

    try {
      const result = await fetchSlotHighlights({
        academicDisciplineId: discipline.academicDisciplineId,
        academicDisciplineType: discipline.lessonType as AcademicDisciplineType,
      });
      setHighlights(result);
      setHighlightedId(disciplineId);
    } finally {
      setLoadingHighlightId(null);
    }
  }, [highlightedId, gridDisciplines]);

  // Общие пропы для обоих вариантов сетки
  const gridProps = {
    disciplines: gridDisciplines,
    highlights,
    onMove: handleDisciplineMove,
    onDisciplineClick: handleDisciplineClick,
    onToggleHighlight: handleToggleHighlight,
    highlightedDisciplineId: highlightedId,
    loadingHighlightId: loadingHighlightId,
    weekOffset,
    onWeekOffsetChange: setWeekOffset,
    scheduleStartDate,
  };

  return (
    <div className={styles.container}>
      {weekLessonsLoading && <div className={styles.loading}>Загрузка...</div>}
      {isTransposed ? (
        <TransposedScheduleGrid {...gridProps} columns={gridColumns} />
      ) : (
        <ScheduleGrid {...gridProps} />
      )}
      <DisciplineList
        disciplines={listItems}
        onReturn={handleDisciplineReturn}
        onDisciplineClick={handleDisciplineClick}
        onToggleHighlight={handleToggleHighlight}
        highlightedDisciplineId={highlightedId}
        loadingHighlightId={loadingHighlightId}
      />
      {editingDiscipline && (
        <EditModal
          discipline={editingDiscipline}
          onSave={handleSaveDiscipline}
          onClose={() => setEditingDiscipline(null)}
        />
      )}
    </div>
  );
};
