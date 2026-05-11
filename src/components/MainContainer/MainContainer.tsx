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
import { fetchTeachersAll } from '../../store/slices/teachersListSlice';
import { fetchClassroomsAll } from '../../store/slices/classroomsListSlice';
import { fetchCampuses } from '../../store/slices/campusSlice';
import type { LessonShortDto, AcademicDisciplineType } from '../../api';
import { useToast } from '../Toast/ToastContext';
import styles from './Styles.module.scss';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SliceSelection {
  type: 'classrooms' | 'teachers' | 'groups';
  entityId: string | string[];
  label: string;
}

export interface DisciplineSection {
  label: string;
  disciplines: Discipline[];
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

function lessonToDiscipline(lesson: LessonShortDto, weekDates: string[]): Discipline {
  const dateIdx = weekDates.indexOf(lesson.dateWithTimeInterval.date);
  const dayId = dateIdx >= 0 ? DAY_IDS[dateIdx] : 'mon';

  return {
    id: lesson.id,
    name: lesson.name || 'Занятие',
    lessonId: lesson.id,
    academicDisciplineId: lesson.academicDisciplineId ?? undefined,
    lessonType: lesson.academicDisciplineType ?? undefined,
    roomId: lesson.rooms[0]?.id ?? undefined,
    forType: 'group',
    forIds: lesson.studentGroups.map((g) => g.id),
    teachers: lesson.teachers.map((t) => ({ id: t.id, name: t.fullname || '' })),
    audiences: lesson.rooms.map((r) => ({ roomId: r.id, roomName: r.name ?? undefined })),
    isStatic: lesson.flexibilityType === 'Fixed',
    canOverlap: lesson.allowCombining,
    repeat: 'every-week',
    weeklyCount: 1,
    isInGrid: true,
    dayId,
    timeStart: lesson.dateWithTimeInterval.timeInterval.timeFrom.slice(0, 5),
    timeEnd: lesson.dateWithTimeInterval.timeInterval.timeTo.slice(0, 5),
    errorLevel: lesson.currentErrorsMaxLevel ?? null,
    teacher: lesson.teachers.map((t) => t.fullname).filter(Boolean).join(', ') || undefined,
    audience: lesson.rooms.map((r) => r.name).filter(Boolean).join(', ') || undefined,
    batchId: lesson.lessonBatchInfoId,
  };
}

function filterLessonsByEntity(
  lessons: LessonShortDto[],
  selection: SliceSelection,
): LessonShortDto[] {
  const ids = Array.isArray(selection.entityId)
    ? selection.entityId
    : [selection.entityId];

  return lessons.filter((lesson) => {
    if (selection.type === 'classrooms') return lesson.rooms.some((r) => ids.includes(r.id));
    if (selection.type === 'teachers') return lesson.teachers.some((t) => ids.includes(t.id));
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
  const teachersList = useAppSelector((s) => s.teachersList.teachers);
  const classrooms = useAppSelector((s) => s.classroomsList.classrooms);
  const campuses = useAppSelector((s) => s.campus.list);

  // Транспонированный режим: несколько групп выбрано
  const isTransposed =
    selection.type === 'groups' &&
    Array.isArray(selection.entityId) &&
    selection.entityId.length > 1;

  const { addToast } = useToast();

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

  // ── Загрузка справочников для обогащения карточек ────────────────────────
  useEffect(() => {
    if (teachersList.length === 0) dispatch(fetchTeachersAll());
    if (classrooms.length === 0) dispatch(fetchClassroomsAll());
    if (campuses.length === 0) dispatch(fetchCampuses());
    if (groups.length === 0) dispatch(fetchGroupsAll());
  }, [dispatch]);

  // ── Фильтрация занятий по сущности ───────────────────────────────────────
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const entityLessons = filterLessonsByEntity(weekLessons, selection);
  const gridDisciplines = entityLessons.map((l) => lessonToDiscipline(l, weekDates));

  // Дисциплины для списка — только не-корневые (листовые)
  const listItems = listDisciplines.filter((d) => !d.isRoot);

  // ── Обогащение карточек именами преподавателей, аудиторий, групп ─────────
  const enrichedListItems = useMemo(() => {
    return listItems.map((d) => {
      // Преподаватель
      const teacherLabel = d.teachers.length > 0
        ? d.teachers
            .map((t) => t.name || teachersList.find((tl) => tl.id === t.id)?.name || '')
            .filter(Boolean)
            .join(', ')
        : undefined;

      // Аудитория + корпус
      const firstRoom = d.audiences[0];
      let audienceLabel: string | undefined;
      let buildingLabel: string | undefined;
      if (firstRoom?.roomId) {
        const room = classrooms.find((c) => c.id === firstRoom.roomId);
        if (room) {
          audienceLabel = room.name;
          const campus = campuses.find((c) => c.id === room.campusId);
          buildingLabel = campus?.name;
        }
      }

      // Время из первого occurrence
      const firstOcc = d.occurrences?.[0];

      return {
        ...d,
        teacher: teacherLabel || 'Без преподавателя',
        audience: audienceLabel || 'Без аудитории',
        building: buildingLabel as any,
        timeStart: firstOcc?.timeStart ?? d.timeStart,
        timeEnd: firstOcc?.timeEnd ?? d.timeEnd,
      };
    });
  }, [listItems, teachersList, classrooms, campuses]);

  // ── Фильтрация карточек по текущему selection ───────────────────────────
  const filteredListItems = useMemo(() => {
    const ids = Array.isArray(selection.entityId)
      ? selection.entityId
      : [selection.entityId];

    return enrichedListItems.filter((d) => {
      switch (selection.type) {
        case 'groups':
          return d.forIds.some((fid) => {
            if (ids.includes(fid)) return true;
            // fid может быть группой, входящей в выбранный поток
            const group = groups.find((g) => g.id === fid);
            if (group) {
              return group.streamIds?.some((sid) => ids.includes(sid)) ?? false;
            }
            // fid может быть подгруппой
            for (const g of groups) {
              if (g.subgroups.some((s) => s.id === fid)) {
                return ids.includes(g.id) || (g.streamIds?.some((sid) => ids.includes(sid)) ?? false);
              }
            }
            return false;
          });
        case 'teachers':
          return d.teachers.some((t) => ids.includes(t.id));
        case 'classrooms':
          return d.audiences.some((a) => ids.includes(a.roomId));
        default:
          return true;
      }
    });
  }, [enrichedListItems, selection, groups]);

  // ── Группировка в секции по покрытию ────────────────────────────────────
  const listSections = useMemo((): DisciplineSection[] => {
    if (selection.type !== 'groups') {
      return [{ label: '', disciplines: filteredListItems }];
    }

    const selectedIds = Array.isArray(selection.entityId)
      ? selection.entityId
      : [selection.entityId];

    const forAll: Discipline[] = [];
    const byEntity = new Map<string, Discipline[]>();

    for (const d of filteredListItems) {
      // Проверяем покрывает ли дисциплина все выбранные группы
      const coversAll = selectedIds.length <= 1 || selectedIds.every((sid) =>
        d.forIds.includes(sid) ||
        d.forIds.some((fid) => {
          const stream = streams.find((s) => s.id === fid);
          return stream?.groupIds.some((gid) =>
            selectedIds.includes(gid) ||
            groups.find((g) => g.id === gid)?.subgroups.some((s) => selectedIds.includes(s.id)),
          );
        }),
      );

      if (coversAll) {
        forAll.push(d);
      } else {
        // Определяем для кого
        for (const fid of d.forIds) {
          const key = groups.find((g) => g.id === fid)?.name
            ?? streams.find((s) => s.id === fid)?.name
            ?? fid;
          if (!byEntity.has(key)) byEntity.set(key, []);
          byEntity.get(key)!.push(d);
        }
      }
    }

    const sections: DisciplineSection[] = [];
    if (forAll.length > 0) sections.push({ label: 'Для всех выбранных', disciplines: forAll });
    for (const [label, disciplines] of byEntity) {
      sections.push({ label: `Для ${label}`, disciplines });
    }
    if (sections.length === 0) sections.push({ label: '', disciplines: [] });
    return sections;
  }, [filteredListItems, selection, streams, groups]);

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
        const result = await dispatch(saveLesson({
          id: existingLesson.id,
          scheduleId: selectedScheduleId,
          academicDisciplineId: existingLesson.academicDisciplineId,
          academicDisciplineType: existingLesson.academicDisciplineType,
          studentGroupIds: existingLesson.studentGroups.map((g) => g.id),
          teacherIds: existingLesson.teachers.map((t) => t.id),
          roomIds: existingLesson.rooms.map((r) => r.id),
          dateWithTimeInterval: {
            date,
            timeInterval: { timeFrom: padTime(timeStart), timeTo: padTime(timeEnd) },
          },
          flexibilityType: existingLesson.flexibilityType,
          allowCombining: existingLesson.allowCombining,
          hoursCost: 2,
        }));
        if (saveLesson.rejected.match(result)) {
          addToast((result.payload as string) || 'Не удалось переместить занятие', 'error');
          refetchWeek(); // откат: восстанавливаем исходную позицию
          return;
        }
      } else {
        // Создаём новое занятие из дисциплины в списке
        const listDiscipline = listDisciplines.find((d) => d.id === disciplineId);
        if (!listDiscipline) return;

        const groupIds = selection.type === 'groups'
          ? (Array.isArray(selection.entityId) ? selection.entityId : [selection.entityId])
          : listDiscipline.forIds;

        const result = await dispatch(saveLesson({
          scheduleId: selectedScheduleId,
          academicDisciplineId: listDiscipline.academicDisciplineId ?? listDiscipline.parentId,
          academicDisciplineType: listDiscipline.lessonType,
          studentGroupIds: groupIds,
          teacherIds: listDiscipline.teachers.map((t) => t.id),
          roomIds: selection.type === 'classrooms'
            ? [selection.entityId as string]
            : [],
          dateWithTimeInterval: {
            date,
            timeInterval: { timeFrom: padTime(timeStart), timeTo: padTime(timeEnd) },
          },
          flexibilityType: 'Flexible',
          allowCombining: false,
          hoursCost: listDiscipline.totalHoursCount ?? 2,
        }));
        if (saveLesson.rejected.match(result)) {
          addToast((result.payload as string) || 'Не удалось добавить занятие', 'error');
          return;
        }
      }

      refetchWeek();
    },
    [dispatch, selectedScheduleId, weekOffset, weekLessons, listDisciplines, selection, refetchWeek, addToast],
  );

  // ── DnD: возврат занятия в список (удаление) ─────────────────────────────
  const handleDisciplineReturn = useCallback(
    async (disciplineId: string) => {
      if (!selectedScheduleId) return;
      const lesson = weekLessons.find((l) => l.id === disciplineId);
      if (!lesson || lesson.flexibilityType === 'Fixed') return;

      const result = await dispatch(deleteWeekLesson({ scheduleId: selectedScheduleId, lessonId: disciplineId }));
      if (deleteWeekLesson.rejected.match(result)) {
        addToast((result.payload as string) || 'Не удалось удалить занятие', 'error');
        refetchWeek(); // откат: восстанавливаем занятие в сетке
      }
    },
    [dispatch, selectedScheduleId, weekLessons, addToast, refetchWeek],
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

      const result = await dispatch(saveLesson({
        id: lesson.id,
        scheduleId: selectedScheduleId,
        academicDisciplineId: lesson.academicDisciplineId,
        academicDisciplineType: lesson.academicDisciplineType,
        studentGroupIds: lesson.studentGroups.map((g) => g.id),
        teacherIds: updated.teachers?.map((t) => t.id) ?? lesson.teachers.map((t) => t.id),
        roomIds: updated.roomId ? [updated.roomId] : lesson.rooms.map((r) => r.id),
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

      if (saveLesson.rejected.match(result)) {
        addToast((result.payload as string) || 'Не удалось сохранить занятие', 'error');
        return; // модальное окно остаётся открытым
      }

      setEditingDiscipline(null);
      refetchWeek();
    },
    [dispatch, selectedScheduleId, weekLessons, weekDates, refetchWeek, addToast],
  );

  // ── Eye icon → week-conflicts → highlights ────────────────────────────────
  const handleToggleHighlight = useCallback(async (disciplineId: string) => {
    if (highlightedId === disciplineId) {
      setHighlightedId(null);
      setHighlights([]);
      return;
    }

    const discipline = gridDisciplines.find((d) => d.id === disciplineId)
      ?? enrichedListItems.find((d) => d.id === disciplineId);

    console.log(discipline);
    if (!discipline?.academicDisciplineId || !discipline.lessonType) return;

    setLoadingHighlightId(disciplineId);
    setHighlightedId(null);
    setHighlights([]);

    try {
      const result = await fetchSlotHighlights({
        academicDisciplineId: discipline.academicDisciplineId,
        academicDisciplineType: discipline.lessonType as AcademicDisciplineType,
        lessonBatchInfoId: discipline.batchId,
      });
      setHighlights(result);
      setHighlightedId(disciplineId);
    } finally {
      setLoadingHighlightId(null);
    }
  }, [highlightedId, gridDisciplines, enrichedListItems]);

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
        sections={listSections}
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
