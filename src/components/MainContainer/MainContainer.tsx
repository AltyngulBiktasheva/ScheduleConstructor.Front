import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ScheduleGrid } from '../ScheduleGrid/ScheduleGrid';
import { TransposedScheduleGrid } from '../ScheduleGrid/TransposedScheduleGrid';
import type { GridColumn } from '../ScheduleGrid/TransposedScheduleGrid';
import { DisciplineList } from '../DisciplineList/DisciplineList';
import { EditModal } from '../EditModal/EditModal';
import { HighlightModal } from '../HighlightModal/HighlightModal';
import type { Discipline } from '../../types';
import type { SlotHighlight } from '../../api/slotHighlights';
import { fetchSlotHighlights } from '../../api/slotHighlights';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchWeekLessons, saveLesson } from '../../store/slices/lessonSlice';
import { fetchGroupsAll } from '../../store/slices/groupsListSlice';
import { fetchTeachersAll } from '../../store/slices/teachersListSlice';
import { fetchClassroomsAll } from '../../store/slices/classroomsListSlice';
import { fetchCampuses } from '../../store/slices/campusSlice';
import type { LessonShortDto, LessonBatchInfoShortDto } from '../../api';
import { useToast } from '../Toast/ToastContext';
import { formatLocalDate } from '../../utils/dateUtils';
import { LESSON_TYPE_LABELS } from '../../pages/disciplines/tabs/RootDisciplineForm';
import type { EditMode } from '../EditModal/EditModal';
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

const BACKEND_DOW_TO_DAY_ID: Record<number, string> = {
  1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

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
    return formatLocalDate(d);
  });
}

function lessonToDiscipline(lesson: LessonShortDto, weekDates: string[]): Discipline {
  const dt = lesson.dateWithTimeInterval!; // гарантировано фильтром lessonsWithTime
  const dateIdx = weekDates.indexOf(dt.date);
  const dayId = dateIdx >= 0 ? DAY_IDS[dateIdx] : 'mon';

  return {
    id: lesson.id,
    name: formatDisciplineName(lesson),
    lessonId: lesson.id,
    academicDisciplineId: lesson.academicDisciplineId ?? undefined,
    lessonType: lesson.academicDisciplineType ?? undefined,
    roomIds: lesson.rooms.map((r) => r.id),
    forType: 'group',
    forIds: lesson.studentGroups.map((g) => g.id),
    forNames: lesson.studentGroups.map((g) => g.name ?? ''),
    teachers: lesson.teachers.map((t) => ({ id: t.id, name: t.fullname || '' })),
    audiences: lesson.rooms.map((r) => ({ roomId: r.id, roomName: r.name ?? undefined })),
    isStatic: lesson.flexibilityType === 'Fixed',
    canOverlap: lesson.allowCombining,
    repeat: 'every-week',
    weeklyCount: 1,
    isInGrid: true,
    dayId,
    timeStart: dt.timeInterval.timeFrom.slice(0, 5),
    timeEnd: dt.timeInterval.timeTo.slice(0, 5),
    errorLevel: lesson.currentErrorsMaxLevel ?? null,
    errorMessage: lesson.lessonPolicyViolationDescription ?? undefined,
    teacher: lesson.teachers.map((t) => t.fullname).filter(Boolean).join(', ') || undefined,
    audience: lesson.rooms.map((r) => r.name).filter(Boolean).join(', ') || undefined,
    comment: lesson.comment,
    dayOfWeekTimeIntervalAssignmentId: lesson.dayOfWeekTimeIntervalAssignmentId ?? undefined,
    isBatchCard: false,
  };
}

function lessonToListDiscipline(lesson: LessonShortDto): Discipline {
  return {
    id: lesson.id,
    name: formatDisciplineName(lesson),
    lessonId: lesson.id,
    academicDisciplineId: lesson.academicDisciplineId ?? undefined,
    lessonType: lesson.academicDisciplineType ?? undefined,
    roomIds: lesson.rooms.map((r) => r.id),
    forType: 'group',
    forIds: lesson.studentGroups.map((g) => g.id),
    forNames: lesson.studentGroups.map((g) => g.name ?? ''),
    teachers: lesson.teachers.map((t) => ({ id: t.id, name: t.fullname || '' })),
    audiences: lesson.rooms.map((r) => ({ roomId: r.id, roomName: r.name ?? undefined })),
    isStatic: lesson.flexibilityType === 'Fixed',
    canOverlap: lesson.allowCombining,
    repeat: 'every-week',
    weeklyCount: 1,
    isInGrid: false,
    errorLevel: lesson.currentErrorsMaxLevel ?? null,
    errorMessage: lesson.lessonPolicyViolationDescription ?? undefined,
    teacher: lesson.teachers.map((t) => t.fullname).filter(Boolean).join(', ') || undefined,
    audience: lesson.rooms.map((r) => r.name).filter(Boolean).join(', ') || undefined,
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

/** Формирует название карточки: «Название (вид занятия)» */
function formatDisciplineName(lesson: LessonShortDto): string {
  const base = lesson.academicDisciplineName || 'Занятие';
  const typeLabel = lesson.academicDisciplineType
    ? LESSON_TYPE_LABELS[lesson.academicDisciplineType]
    : undefined;
  return typeLabel ? `${base} (${typeLabel})` : base;
}

function padTime(t: string): string {
  return t.slice(0, 5);
}

function formatBatchName(batch: LessonBatchInfoShortDto): string {
  const base = batch.academicDisciplineName || 'Серия';
  const typeLabel = batch.type ? LESSON_TYPE_LABELS[batch.type] : undefined;
  return typeLabel ? `${base} (${typeLabel})` : base;
}

function batchToDisciplines(batch: LessonBatchInfoShortDto): Discipline[] {
  return batch.dayOfWeekTimeIntervals.map((assignment) => {
    const dayId = BACKEND_DOW_TO_DAY_ID[assignment.dayOfWeekTimeInterval.dayOfWeek];
    const ti = assignment.dayOfWeekTimeInterval.timeInterval;
    return {
      id: `batch-${batch.id}-${assignment.id}`,
      name: formatBatchName(batch),
      lessonBatchInfoId: batch.id,
      dayOfWeekTimeIntervalAssignmentId: assignment.id,
      isBatchCard: true,
      academicDisciplineId: batch.academicDisciplineId ?? undefined,
      lessonType: batch.type ?? undefined,
      roomIds: batch.rooms.map((r) => r.id),
      forType: 'group' as const,
      forIds: batch.studentGroups.map((g) => g.id),
      forNames: batch.studentGroups.map((g) => g.name ?? ''),
      teachers: batch.teachers.map((t) => ({ id: t.id, name: t.fullname || '' })),
      audiences: batch.rooms.map((r) => ({ roomId: r.id, roomName: r.name ?? undefined })),
      isStatic: batch.flexibilityType === 'Fixed',
      canOverlap: batch.allowCombining,
      repeat: 'every-week' as const,
      weeklyCount: batch.lessonsPerWeekCount,
      isInGrid: !!dayId,
      dayId,
      timeStart: ti.timeFrom.slice(0, 5),
      timeEnd: ti.timeTo.slice(0, 5),
      errorLevel: batch.currentErrorsMaxLevel ?? null,
      errorMessage: batch.lessonPolicyViolationDescription ?? undefined,
      teacher: batch.teachers.map((t) => t.fullname).filter(Boolean).join(', ') || undefined,
      audience: batch.rooms.map((r) => r.name).filter(Boolean).join(', ') || undefined,
      comment: batch.comment,
    };
  });
}

function batchToListDiscipline(batch: LessonBatchInfoShortDto): Discipline {
  return {
    id: `batch-${batch.id}`,
    name: formatBatchName(batch),
    lessonBatchInfoId: batch.id,
    isBatchCard: true,
    academicDisciplineId: batch.academicDisciplineId ?? undefined,
    lessonType: batch.type ?? undefined,
    roomIds: batch.rooms.map((r) => r.id),
    forType: 'group' as const,
    forIds: batch.studentGroups.map((g) => g.id),
    forNames: batch.studentGroups.map((g) => g.name ?? ''),
    teachers: batch.teachers.map((t) => ({ id: t.id, name: t.fullname || '' })),
    audiences: batch.rooms.map((r) => ({ roomId: r.id, roomName: r.name ?? undefined })),
    isStatic: batch.flexibilityType === 'Fixed',
    canOverlap: batch.allowCombining,
    repeat: 'every-week' as const,
    weeklyCount: batch.lessonsPerWeekCount,
    isInGrid: false,
    errorLevel: batch.currentErrorsMaxLevel ?? null,
    errorMessage: batch.lessonPolicyViolationDescription ?? undefined,
    teacher: batch.teachers.map((t) => t.fullname).filter(Boolean).join(', ') || undefined,
    audience: batch.rooms.map((r) => r.name).filter(Boolean).join(', ') || undefined,
    comment: batch.comment,
  };
}

function filterBatchesByEntity(
  batches: LessonBatchInfoShortDto[],
  selection: SliceSelection,
): LessonBatchInfoShortDto[] {
  const ids = Array.isArray(selection.entityId)
    ? selection.entityId
    : [selection.entityId];

  return batches.filter((batch) => {
    if (selection.type === 'classrooms') return batch.rooms.some((r) => ids.includes(r.id));
    if (selection.type === 'teachers') return batch.teachers.some((t) => ids.includes(t.id));
    if (selection.type === 'groups') return batch.studentGroups.some((g) => ids.includes(g.id));
    return false;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export const MainContainer: React.FC<Props> = ({ selection }) => {
  const dispatch = useAppDispatch();
  const { weekLessons, weekBatches, weekLessonsLoading } = useAppSelector((s) => s.lesson);
  const selectedScheduleId = useAppSelector((s) => s.schedule.selectedScheduleId);
  const scheduleDateInterval = useAppSelector((s) =>
    s.schedule.list.find((sc) => sc.id === s.schedule.selectedScheduleId)?.dateInterval ?? null
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

  // Вычисляем начальный offset: если текущая дата вне рамок расписания — показываем первую неделю
  const [weekOffset, setWeekOffset] = useState(() => {
    if (!scheduleDateInterval) return 0;
    const now = new Date();
    const schedStart = new Date(scheduleDateInterval.dateFrom);
    const schedEnd = new Date(scheduleDateInterval.dateTo);
    if (now >= schedStart && now <= schedEnd) return 0;
    // Текущая дата вне расписания → сдвигаем к началу расписания
    const dow = now.getDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + diffToMonday);
    currentMonday.setHours(0, 0, 0, 0);
    const startDow = schedStart.getDay();
    const startDiffToMonday = startDow === 0 ? -6 : 1 - startDow;
    const schedMonday = new Date(schedStart);
    schedMonday.setDate(schedStart.getDate() + startDiffToMonday);
    schedMonday.setHours(0, 0, 0, 0);
    return Math.round((schedMonday.getTime() - currentMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  });
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [loadingHighlightId, setLoadingHighlightId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<SlotHighlight[]>([]);
  const [highlightModal, setHighlightModal] = useState<SlotHighlight | null>(null);
  const [detachedWarning, setDetachedWarning] = useState<{ message: string; dto: any } | null>(null);

  // ── Debounce weekOffset для API-запросов (500мс) ──────────────────────────
  const [debouncedWeekOffset, setDebouncedWeekOffset] = useState(weekOffset);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedWeekOffset(weekOffset), 500);
    return () => clearTimeout(timer);
  }, [weekOffset]);

  // ── Загрузка занятий недели ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedScheduleId) return;
    const weekDates = getWeekDates(debouncedWeekOffset);
    dispatch(fetchWeekLessons({
      scheduleId: selectedScheduleId,
      dateFrom: weekDates[0],
      dateTo: weekDates[5],
    }));
  }, [dispatch, selectedScheduleId, debouncedWeekOffset]);


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

  // ── Фильтрация занятий и серий по сущности ────────────────────────────────
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const entityLessons = filterLessonsByEntity(weekLessons, selection);
  const entityBatches = filterBatchesByEntity(weekBatches, selection);
  const lessonsWithTime = entityLessons.filter((l) => l.dateWithTimeInterval != null);
  const lessonsWithoutTime = entityLessons.filter((l) => l.dateWithTimeInterval == null);

  const lessonAssignmentIds = useMemo(() => new Set(
    weekLessons
      .filter((l) => l.dayOfWeekTimeIntervalAssignmentId)
      .map((l) => l.dayOfWeekTimeIntervalAssignmentId!),
  ), [weekLessons]);

  const batchCards = useMemo(
    () => entityBatches.flatMap(batchToDisciplines),
    [entityBatches],
  );
  const unreplacedBatchCards = useMemo(
    () => batchCards.filter((bc) => !lessonAssignmentIds.has(bc.dayOfWeekTimeIntervalAssignmentId!)),
    [batchCards, lessonAssignmentIds],
  );
  const lessonCards = lessonsWithTime.map((l) => lessonToDiscipline(l, weekDates));
  const gridDisciplines = useMemo(
    () => [...unreplacedBatchCards, ...lessonCards],
    [unreplacedBatchCards, lessonCards],
  );

  // Серии без назначенного времени → боковой список
  const unscheduledBatches = entityBatches.filter((b) => b.dayOfWeekTimeIntervals.length === 0);
  const batchListItems = unscheduledBatches.map(batchToListDiscipline);
  const listItems = [...lessonsWithoutTime.map(lessonToListDiscipline), ...batchListItems];

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
      // Поток → filterIds = сам stream ID + все группы и подгруппы потока
      const stream = streams.find((s) => s.id === entityId);
      if (stream) {
        const filterIds = [
          entityId,  // сам ID потока (дисциплина может быть назначена на поток)
          ...stream.groupIds.flatMap((gid) => {
            const g = groups.find((gr) => gr.id === gid);
            return g ? [gid, ...g.subgroups.map((sg) => sg.id)] : [gid];
          }),
        ];
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
    async (disciplineId: string, dayId: string, timeStart: string, timeEnd: string, targetColumnId?: string) => {
      if (!selectedScheduleId) return;

      const dates = getWeekDates(weekOffset);
      const dayIdx = DAY_IDS.indexOf(dayId as typeof DAY_IDS[number]);
      const date = dates[dayIdx] ?? dates[0];

      // Batch-карточка: создаём новое занятие из серии
      const batchCard = gridDisciplines.find((d) => d.id === disciplineId && d.isBatchCard);
      if (batchCard) {
        const batch = weekBatches.find((b) => b.id === batchCard.lessonBatchInfoId);
        if (!batch || batch.flexibilityType === 'Fixed') return;

        const result = await dispatch(saveLesson({
          id: null,
          studentGroupIds: batch.studentGroups.map((g) => g.id),
          teacherIds: batch.teachers.map((t) => t.id),
          roomIds: batch.rooms.map((r) => r.id),
          dateWithTimeInterval: {
            date,
            timeInterval: { timeFrom: padTime(timeStart), timeTo: padTime(timeEnd) },
          },
          flexibilityType: batch.flexibilityType,
          allowCombining: batch.allowCombining,
          lessonBatchInfoId: batch.id,
          dayOfWeekTimeIntervalAssignmentId: batchCard.dayOfWeekTimeIntervalAssignmentId ?? null,
          hoursCost: batch.hoursCost ?? 2,
          updateBatch: false,
        }));
        if (saveLesson.rejected.match(result)) {
          addToast((result.payload as string) || 'Не удалось создать занятие из серии', 'error');
          return;
        }
        refetchWeek();
        return;
      }

      const existingLesson = weekLessons.find((l) => l.id === disciplineId);

      if (existingLesson) {
        // Запрет перемещения в колонку другой группы (транспонированный режим)
        if (isTransposed && targetColumnId) {
          const targetCol = gridColumns.find((c) => c.id === targetColumnId);
          if (targetCol) {
            const lessonGroupIds = existingLesson.studentGroups.map((g) => g.id);
            const belongsToTarget = lessonGroupIds.some((gid) => targetCol.filterIds.includes(gid));
            if (!belongsToTarget) {
              addToast('Нельзя переместить занятие в колонку другой группы. Измените группы в разделе «Дисциплины»', 'info');
              return;
            }
          }
        }

        if (existingLesson.flexibilityType === 'Fixed') return;
        const result = await dispatch(saveLesson({
          id: existingLesson.id,
          studentGroupIds: existingLesson.studentGroups.map((g) => g.id),
          teacherIds: existingLesson.teachers.map((t) => t.id),
          roomIds: existingLesson.rooms.map((r) => r.id),
          dateWithTimeInterval: {
            date,
            timeInterval: { timeFrom: padTime(timeStart), timeTo: padTime(timeEnd) },
          },
          flexibilityType: existingLesson.flexibilityType,
          allowCombining: existingLesson.allowCombining,
          lessonBatchInfoId: null,
          dayOfWeekTimeIntervalAssignmentId: existingLesson.dayOfWeekTimeIntervalAssignmentId ?? null,
          hoursCost: 2,
          updateBatch: false,
        }));
        if (saveLesson.rejected.match(result)) {
          addToast((result.payload as string) || 'Не удалось переместить занятие', 'error');
          refetchWeek();
          return;
        }
      } else {
        // Создаём новое занятие из дисциплины в списке (или из batch в списке)
        const unscheduledLesson = weekLessons.find((l) => l.id === disciplineId);

        if (unscheduledLesson) {
          const groupIds = selection.type === 'groups'
            ? (Array.isArray(selection.entityId) ? selection.entityId : [selection.entityId])
            : unscheduledLesson.studentGroups.map((g) => g.id);

          const result = await dispatch(saveLesson({
            id: unscheduledLesson.id,
            studentGroupIds: groupIds,
            teacherIds: unscheduledLesson.teachers.map((t) => t.id),
            roomIds: selection.type === 'classrooms'
              ? [selection.entityId as string]
              : unscheduledLesson.rooms.map((r) => r.id),
            dateWithTimeInterval: {
              date,
              timeInterval: { timeFrom: padTime(timeStart), timeTo: padTime(timeEnd) },
            },
            flexibilityType: unscheduledLesson.flexibilityType,
            allowCombining: unscheduledLesson.allowCombining,
            hoursCost: 2,
            updateBatch: true,
          }));
          if (saveLesson.rejected.match(result)) {
            addToast((result.payload as string) || 'Не удалось добавить занятие', 'error');
            return;
          }
        } else {
          // Unscheduled batch card from sidebar
          const listBatchCard = enrichedListItems.find((d) => d.id === disciplineId && d.isBatchCard);
          if (!listBatchCard) return;
          const batch = weekBatches.find((b) => b.id === listBatchCard.lessonBatchInfoId);
          if (!batch) return;

          const result = await dispatch(saveLesson({
            id: null,
            studentGroupIds: batch.studentGroups.map((g) => g.id),
            teacherIds: batch.teachers.map((t) => t.id),
            roomIds: batch.rooms.map((r) => r.id),
            dateWithTimeInterval: {
              date,
              timeInterval: { timeFrom: padTime(timeStart), timeTo: padTime(timeEnd) },
            },
            flexibilityType: batch.flexibilityType,
            allowCombining: batch.allowCombining,
            lessonBatchInfoId: batch.id,
            dayOfWeekTimeIntervalAssignmentId: null,
            hoursCost: batch.hoursCost ?? 2,
            updateBatch: false,
          }));
          if (saveLesson.rejected.match(result)) {
            addToast((result.payload as string) || 'Не удалось создать занятие из серии', 'error');
            return;
          }
        }
      }

      refetchWeek();
    },
    [dispatch, selectedScheduleId, weekOffset, weekLessons, weekBatches, gridDisciplines, enrichedListItems, selection, refetchWeek, addToast, isTransposed, gridColumns],
  );

  // ── DnD: возврат занятия в список (снятие времени) ────────────────────────
  const handleDisciplineReturn = useCallback(
    async (disciplineId: string) => {
      if (!selectedScheduleId) return;

      if (disciplineId.startsWith('batch-')) {
        addToast('Серию нельзя вернуть в список — используйте раздел «Дисциплины»', 'info');
        return;
      }

      const lesson = weekLessons.find((l) => l.id === disciplineId);
      if (!lesson || lesson.flexibilityType === 'Fixed') return;

      const result = await dispatch(saveLesson({
        id: lesson.id,
        studentGroupIds: lesson.studentGroups.map((g) => g.id),
        teacherIds: lesson.teachers.map((t) => t.id),
        roomIds: lesson.rooms.map((r) => r.id),
        dateWithTimeInterval: null,
        flexibilityType: lesson.flexibilityType,
        allowCombining: lesson.allowCombining,
        hoursCost: 2,
        updateBatch: false,
      }));
      if (saveLesson.rejected.match(result)) {
        addToast((result.payload as string) || 'Не удалось снять время с занятия', 'error');
        refetchWeek(); // откат: восстанавливаем занятие в сетке
        return;
      }
      refetchWeek();
    },
    [dispatch, selectedScheduleId, weekLessons, addToast, refetchWeek],
  );

  // ── Клик на карточку → открыть модалку ───────────────────────────────────
  const handleDisciplineClick = useCallback((discipline: Discipline) => {
    setEditingDiscipline(discipline);
  }, []);

  // ── Сохранение из EditModal → POST /lesson/save ───────────────────────────
  const handleSaveDiscipline = useCallback(
    async (updated: Discipline, editMode: EditMode) => {
      if (!selectedScheduleId) return;

      // Batch-карточка: создаём новое занятие или обновляем всю серию
      if (updated.isBatchCard) {
        const batch = weekBatches.find((b) => b.id === updated.lessonBatchInfoId);
        if (!batch) { setEditingDiscipline(null); return; }

        const date = updated.dayId
          ? weekDates[DAY_IDS.indexOf(updated.dayId as typeof DAY_IDS[number])] ?? weekDates[0]
          : weekDates[0];

        const result = await dispatch(saveLesson({
          id: editMode === 'batch' ? null : null,
          studentGroupIds: updated.forIds ?? batch.studentGroups.map((g) => g.id),
          teacherIds: updated.teachers?.map((t) => t.id) ?? batch.teachers.map((t) => t.id),
          roomIds: updated.roomIds || batch.rooms.map((r) => r.id),
          dateWithTimeInterval: {
            date,
            timeInterval: {
              timeFrom: padTime(updated.timeStart ?? '09:00'),
              timeTo: padTime(updated.timeEnd ?? '10:30'),
            },
          },
          flexibilityType: batch.flexibilityType,
          allowCombining: batch.allowCombining,
          lessonBatchInfoId: batch.id,
          dayOfWeekTimeIntervalAssignmentId: updated.dayOfWeekTimeIntervalAssignmentId ?? null,
          hoursCost: batch.hoursCost ?? 2,
          updateBatch: editMode === 'batch',
        }));

        if (saveLesson.rejected.match(result)) {
          addToast((result.payload as string) || 'Не удалось сохранить', 'error');
          return;
        }
        setEditingDiscipline(null);
        refetchWeek();
        return;
      }

      const lesson = weekLessons.find((l) => l.id === updated.id);
      if (!lesson) {
        setEditingDiscipline(null);
        return;
      }

      const date = updated.dayId
        ? weekDates[DAY_IDS.indexOf(updated.dayId as typeof DAY_IDS[number])] ?? weekDates[0]
        : lesson.dateWithTimeInterval?.date ?? weekDates[0];

      const result = await dispatch(saveLesson({
        id: lesson.id,
        studentGroupIds: lesson.studentGroups.map((g) => g.id),
        teacherIds: updated.teachers?.map((t) => t.id) ?? lesson.teachers.map((t) => t.id),
        roomIds: updated.roomIds || lesson.rooms.map((r) => r.id),
        dateWithTimeInterval: {
          date,
          timeInterval: {
            timeFrom: padTime(updated.timeStart ?? lesson.dateWithTimeInterval?.timeInterval?.timeFrom?.slice(0, 5) ?? '09:00'),
            timeTo: padTime(updated.timeEnd ?? lesson.dateWithTimeInterval?.timeInterval?.timeTo?.slice(0, 5) ?? '10:30'),
          },
        },
        flexibilityType: lesson.flexibilityType,
        allowCombining: lesson.allowCombining,
        lessonBatchInfoId: null,
        dayOfWeekTimeIntervalAssignmentId: lesson.dayOfWeekTimeIntervalAssignmentId ?? null,
        hoursCost: 2,
        updateBatch: editMode === 'batch',
      }));

      if (saveLesson.rejected.match(result)) {
        const errorMsg = (result.payload as string) || '';
        if (editMode === 'batch' && errorMsg.toLowerCase().includes('откреплено')) {
          setDetachedWarning({
            message: errorMsg,
            dto: {
              id: lesson.id,
              studentGroupIds: lesson.studentGroups.map((g) => g.id),
              teacherIds: updated.teachers?.map((t) => t.id) ?? lesson.teachers.map((t) => t.id),
              roomIds: updated.roomIds || lesson.rooms.map((r) => r.id),
              dateWithTimeInterval: {
                date,
                timeInterval: {
                  timeFrom: padTime(updated.timeStart ?? lesson.dateWithTimeInterval?.timeInterval?.timeFrom?.slice(0, 5) ?? '09:00'),
                  timeTo: padTime(updated.timeEnd ?? lesson.dateWithTimeInterval?.timeInterval?.timeTo?.slice(0, 5) ?? '10:30'),
                },
              },
              flexibilityType: lesson.flexibilityType,
              allowCombining: lesson.allowCombining,
              hoursCost: 2,
              updateBatch: false,
            },
          });
          return;
        }
        addToast(errorMsg || 'Не удалось сохранить занятие', 'error');
        return;
      }

      setEditingDiscipline(null);
      refetchWeek();
    },
    [dispatch, selectedScheduleId, weekLessons, weekBatches, weekDates, refetchWeek, addToast],
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

    if (!discipline) return;

    if (discipline.isBatchCard) {
      addToast('Подсветка конфликтов недоступна для карточек серий', 'info');
      return;
    }

    setLoadingHighlightId(disciplineId);
    setHighlightedId(null);
    setHighlights([]);

    try {
      const result = await fetchSlotHighlights({
        lessonId: discipline.lessonId ?? discipline.id,
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
    onHighlightClick: (hl: SlotHighlight) => setHighlightModal(hl),
    highlightedDisciplineId: highlightedId,
    loadingHighlightId: loadingHighlightId,
    weekOffset,
    onWeekOffsetChange: setWeekOffset,
    scheduleDateInterval,
  };

  return (
    <div className={styles.container}>
      {isTransposed ? (
        <TransposedScheduleGrid {...gridProps} columns={gridColumns} loading={weekLessonsLoading} />
      ) : (
        <ScheduleGrid {...gridProps} loading={weekLessonsLoading} />
      )}
      <DisciplineList
        sections={listSections}
        onReturn={handleDisciplineReturn}
        onDisciplineClick={handleDisciplineClick}
        onToggleHighlight={handleToggleHighlight}
        highlightedDisciplineId={highlightedId}
        loadingHighlightId={loadingHighlightId}
        loading={weekLessonsLoading}
      />
      {editingDiscipline && (
        <EditModal
          discipline={editingDiscipline}
          onSave={handleSaveDiscipline}
          onClose={() => setEditingDiscipline(null)}
        />
      )}
      {highlightModal && (
        <HighlightModal
          messages={highlightModal.messages}
          color={highlightModal.color}
          onClose={() => setHighlightModal(null)}
        />
      )}
      {detachedWarning && (
        <div className={styles.overlay} onClick={() => setDetachedWarning(null)}>
          <div className={styles.detachedModal} onClick={(e) => e.stopPropagation()}>
            <p>{detachedWarning.message}</p>
            <p className={styles.detachedHint}>Изменения будут применены только к этому занятию.</p>
            <div className={styles.detachedActions}>
              <button className={styles.detachedCancel} onClick={() => setDetachedWarning(null)}>Отмена</button>
              <button
                className={styles.detachedConfirm}
                onClick={async () => {
                  const dto = detachedWarning.dto;
                  setDetachedWarning(null);
                  const retryResult = await dispatch(saveLesson(dto));
                  if (saveLesson.fulfilled.match(retryResult)) {
                    setEditingDiscipline(null);
                    refetchWeek();
                    addToast('Занятие сохранено (как отдельное)', 'success');
                  } else {
                    addToast((retryResult.payload as string) || 'Не удалось сохранить', 'error');
                  }
                }}
              >
                Сохранить как отдельное
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
