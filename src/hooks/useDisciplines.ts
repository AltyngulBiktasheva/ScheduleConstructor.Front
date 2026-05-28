/**
 * Публичный интерфейс: { rootDisciplines, disciplines, loading, error, newlyCreatedId,
 *                         add, addRoot, update, remove, refetch }
 *
 * Корневые дисциплины → /academic-discipline/save
 * Дочерние (обычные) → /lesson/save
 *
 * add/addRoot/update возвращают Promise<boolean> — true если сохранение успешно.
 * При ошибке показывается тост, навигация остаётся за вызывающим кодом.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchDisciplinesAll,
  addDisciplineLocally,
  updateDisciplineLocally,
  removeDisciplineLocally,
  saveDisciplineOnServer,
} from '../store/slices/disciplinesListSlice';
import {academicDisciplineApi, type LessonBatchInfoSaveDto} from '../api';
import { fetchSchedules, saveSchedule } from '../store/slices/scheduleSlice';
import type {
  DayOfWeek,
  DisciplineLessonRepeatType,
  LessonBatchInfoDto,
} from '../api';
import type { Discipline } from '../types/discipline';
import type { RootDisciplineFormData } from '../pages/disciplines/tabs/RootDisciplineForm';
import { useToast } from '../components/Toast/ToastContext';
import { extractError } from '../utils/extractError';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** DD.MM.YYYY → YYYY-MM-DD */
function displayToApiDate(display: string): string {
  const [d, m, y] = display.split('.');
  return `${y}-${m}-${d}`;
}

/** HH:MM → HH:MM (уже правильный формат для бэка) */
function padTime(t: string): string {
  return t.length === 5 ? t : '09:00';
}

// ─── Helpers для /academic-discipline/save ────────────────────────────────────

const DAY_ID_TO_DOW: Record<string, DayOfWeek> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
};

function mapRepeatType(repeat: string | undefined): DisciplineLessonRepeatType {
  switch (repeat) {
    case 'even-weeks': return 'EvenWeeks';
    case 'odd-weeks':  return 'OddWeeks';
    case 'once':       return 'Once';
    default:           return 'Weekly';
  }
}

function buildSaveLessonBatchInfo(
  discipline: Discipline,
  dateInterval: { dateFrom: string; dateTo: string },
): LessonBatchInfoSaveDto {
  return {
    id: discipline.lessonId || undefined,
    studentGroupIds: discipline.forIds,
    teacherIds: discipline.teachers.map((t) => t.id),
    roomIds: discipline.roomIds,
    lessonsPerWeekCount: discipline.weeklyCount ?? 1,
    dayOfWeekTimeIntervals: discipline.occurrences?.length
      ? discipline.occurrences.map((occ) => ({
          id: occ.id,
          dayOfWeekTimeInterval: {
            dayOfWeek: DAY_ID_TO_DOW[occ.dayId] ?? 1,
            timeInterval: { timeFrom: padTime(occ.timeStart), timeTo: padTime(occ.timeEnd) },
          },
        }))
      : [],
    repeatType: mapRepeatType(discipline.repeat),
    dateInterval,
    allowCombining: discipline.canOverlap,
    flexibilityType: discipline.isStatic ? 'Fixed' as const : 'Flexible' as const,
    hoursCost: discipline.totalHoursCount ?? 0,
    totalHoursCount: discipline.totalHoursCount ?? 0,
    comment: discipline.comment,
  };
}

/** Резолвит даты: пользовательские значения имеют приоритет, недостающие берутся из расписания */
function resolveDateInterval(
  dateRange: { from?: string; to?: string } | undefined,
  scheduleDateInterval: { dateFrom: string; dateTo: string } | undefined,
): { dateFrom: string; dateTo: string } {
  const userFrom = dateRange?.from ? displayToApiDate(dateRange.from) : '';
  const userTo   = dateRange?.to   ? displayToApiDate(dateRange.to)   : '';
  return {
    dateFrom: userFrom || scheduleDateInterval?.dateFrom || '',
    dateTo:   userTo   || scheduleDateInterval?.dateTo   || '',
  };
}

/** Если payload null — возвращает дефолтный объект с пустым массивом */
function payloadOrDefault(payload: LessonBatchInfoDto[] | null | undefined): LessonBatchInfoSaveDto[] {
  return payload?.map((x) =>
      ({ ...x, studentGroupIds: x.studentGroups.map((sg) => sg.id) })) ?? [];
}

/** Маппинг lessonType → ключ в DTO */
const BATCH_KEY_MAP: Record<string, 'lectureLessonBatchInfos' | 'practiceLessonBatchInfos' | 'labLessonBatchInfos' | 'examLessonBatchInfos' | 'testLessonBatchInfos'> = {
  Lecture:  'lectureLessonBatchInfos',
  Practice: 'practiceLessonBatchInfos',
  Lab:      'labLessonBatchInfos',
  Exam:     'examLessonBatchInfos',
  Test:     'testLessonBatchInfos',
};

/** Собирает и отправляет /academic-discipline/save для Lecture/Practice/Lab */
async function saveAsPayload(
  discipline: Discipline,
  scheduleId: string,
  rootDisciplines: Discipline[],
  dateInterval: { dateFrom: string; dateTo: string },
): Promise<void> {
  const parentId = (discipline.parentId ?? discipline.academicDisciplineId)!;
  const lessonType = discipline.lessonType!;

  const { data: viewDto } = await academicDisciplineApi.getAcademicDiscipline({
    academicDisciplineId: parentId,
  });
  const root = rootDisciplines.find((r) => r.id === parentId);

  // Основной batch + дополнительные из _extraBatches (транспортное поле формы)
  const allBatchInfos: LessonBatchInfoSaveDto[] = [
    buildSaveLessonBatchInfo(discipline, dateInterval),
    ...(discipline._extraBatches ?? []).map((extra) => {
      const extraDateInterval = resolveDateInterval(
        extra.dateRange,
        { dateFrom: dateInterval.dateFrom, dateTo: dateInterval.dateTo },
      );
      return buildSaveLessonBatchInfo({ ...discipline, ...extra } as Discipline, extraDateInterval);
    }),
  ];

  // Загружаем существующие batch-и того же типа и добавляем новые к ним
  const batchKey = BATCH_KEY_MAP[lessonType];
  const existingBatches: LessonBatchInfoSaveDto[] = (viewDto[batchKey] ?? []).map((b: any) => ({
    ...b,
    studentGroupIds: b.studentGroups?.map((sg: any) => sg.id) ?? b.studentGroupIds ?? [],
  }));

  // Дедупликация: убираем из existing те batch-и, которые были отредактированы
  const editedIds = new Set(allBatchInfos.map((b) => b.id).filter(Boolean));
  const untouchedExisting = existingBatches.filter((b) => !b.id || !editedIds.has(b.id));
  const updatedPayload: LessonBatchInfoSaveDto[] = [...untouchedExisting, ...allBatchInfos];

  await academicDisciplineApi.saveAcademicDiscipline({
    id: parentId,
    scheduleId,
    name: viewDto.name ?? root?.name,
    semesterNumber: viewDto.semesterNumber ?? root?.semesterNumber ?? 1,
    academicDisciplineTargetType: viewDto.academicDisciplineTargetType,
    allowedLessonTypes: viewDto.allowedLessonTypes ?? root?.allowedLessonTypes,
    lectureLessonBatchInfos:  lessonType === 'Lecture'  ? updatedPayload : payloadOrDefault(viewDto.lectureLessonBatchInfos),
    practiceLessonBatchInfos: lessonType === 'Practice' ? updatedPayload : payloadOrDefault(viewDto.practiceLessonBatchInfos),
    labLessonBatchInfos:      lessonType === 'Lab'      ? updatedPayload : payloadOrDefault(viewDto.labLessonBatchInfos),
    examLessonBatchInfos:     lessonType === 'Exam'     ? updatedPayload : payloadOrDefault(viewDto.examLessonBatchInfos),
    testLessonBatchInfos:     lessonType === 'Test'     ? updatedPayload : payloadOrDefault(viewDto.testLessonBatchInfos),
    comment: viewDto.comment ?? undefined,
  });
}

/** Сохраняет одно занятие из batch-а, не трогая остальные batch-и того же типа */
async function saveSingleBatch(
  discipline: Discipline,
  scheduleId: string,
  rootDisciplines: Discipline[],
  dateInterval: { dateFrom: string; dateTo: string },
): Promise<void> {
  const parentId = (discipline.parentId ?? discipline.academicDisciplineId)!;
  const lessonType = discipline.lessonType!;
  const batchKey = BATCH_KEY_MAP[lessonType];

  const { data: viewDto } = await academicDisciplineApi.getAcademicDiscipline({
    academicDisciplineId: parentId,
  });
  const root = rootDisciplines.find((r) => r.id === parentId);
  const existingBatches: LessonBatchInfoDto[] = viewDto[batchKey] ?? [];

  // Заменяем только редактируемый batch по id, остальные оставляем
  const updatedBatches = existingBatches.map((b) =>
    b.id === discipline.lessonId
      ? buildSaveLessonBatchInfo(discipline, dateInterval)
      : ({ ...b, studentGroupIds: b.studentGroups.map((sg) => sg.id) }),
  );

  await academicDisciplineApi.saveAcademicDiscipline({
    id: parentId,
    scheduleId,
    name: viewDto.name ?? root?.name,
    semesterNumber: viewDto.semesterNumber ?? root?.semesterNumber ?? 1,
    academicDisciplineTargetType: viewDto.academicDisciplineTargetType,
    allowedLessonTypes: viewDto.allowedLessonTypes ?? root?.allowedLessonTypes,
    lectureLessonBatchInfos:  batchKey === 'lectureLessonBatchInfos'  ? updatedBatches : payloadOrDefault(viewDto.lectureLessonBatchInfos),
    practiceLessonBatchInfos: batchKey === 'practiceLessonBatchInfos' ? updatedBatches : payloadOrDefault(viewDto.practiceLessonBatchInfos),
    labLessonBatchInfos:      batchKey === 'labLessonBatchInfos'      ? updatedBatches : payloadOrDefault(viewDto.labLessonBatchInfos),
    examLessonBatchInfos:     batchKey === 'examLessonBatchInfos'     ? updatedBatches : payloadOrDefault(viewDto.examLessonBatchInfos),
    testLessonBatchInfos:     batchKey === 'testLessonBatchInfos'     ? updatedBatches : payloadOrDefault(viewDto.testLessonBatchInfos),
    comment: viewDto.comment ?? undefined,
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDisciplines() {
  const dispatch = useAppDispatch();
  const { rootDisciplines, disciplines, loading, error } = useAppSelector((s) => s.disciplinesList);
  const { list: scheduleList, selectedScheduleId } = useAppSelector((s) => s.schedule);
  const { addToast } = useToast();
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchDisciplinesAll(selectedScheduleId ?? undefined));
    dispatch(fetchSchedules());
  }, [dispatch, selectedScheduleId]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const refetch = useCallback(() => dispatch(fetchDisciplinesAll(selectedScheduleId ?? undefined)), [dispatch, selectedScheduleId]);

  const getOrCreateScheduleId = useCallback(async (): Promise<string | null> => {
    if (selectedScheduleId) return selectedScheduleId;
    if (scheduleList.length > 0) return scheduleList[0].id;
    await dispatch(saveSchedule({ name: 'Основное расписание', dateInterval: { dateFrom: '2025-09-01', dateTo: '2026-01-31' } }));
    const updated = await dispatch(fetchSchedules());
    const list = (updated.payload as typeof scheduleList) ?? [];
    return list[0]?.id ?? null;
  }, [selectedScheduleId, scheduleList, dispatch]);

  // ── Корневая дисциплина ────────────────────────────────────────────────────

  const addRoot = useCallback(
    async (data: RootDisciplineFormData): Promise<boolean> => {
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return false;

      const tempDiscipline: Discipline = {
        id: crypto.randomUUID(),
        name: data.name,
        isRoot: true,
        semesterNumber: data.semesterNumber,
        allowedLessonTypes: data.allowedLessonTypes,
        roomIds: [],
        forType: 'group',
        forIds: [],
        teachers: [],
        audiences: [],
        isStatic: false,
        canOverlap: false,
        repeat: 'every-week',
        weeklyCount: 1,
      };

      dispatch(addDisciplineLocally(tempDiscipline));
      markCreated(tempDiscipline.id);

      const result = await dispatch(
        saveDisciplineOnServer({
          discipline: tempDiscipline,
          isNew: true,
          dto: {
            scheduleId,
            name: data.name,
            semesterNumber: data.semesterNumber,
            academicDisciplineTargetType: 'General',
            allowedLessonTypes: data.allowedLessonTypes,
            associatedNames: data.associatedNames,
          },
        }),
      );

      if (saveDisciplineOnServer.rejected.match(result)) {
        dispatch(removeDisciplineLocally(tempDiscipline.id));
        addToast((result.payload as string) || 'Не удалось создать корневую дисциплину', 'error');
        return false;
      }

      return true;
    },
    [dispatch, getOrCreateScheduleId, addToast],
  );

  // ── Обычная дисциплина ────────────────────────────────────────────────────

  const add = useCallback(
    async (discipline: Discipline): Promise<boolean> => {
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return false;

      try {
        const selectedSchedule = scheduleList.find((sc) => sc.id === selectedScheduleId);
        const dateInterval = resolveDateInterval(discipline.dateRange, selectedSchedule?.dateInterval);
        await saveAsPayload(discipline, scheduleId, rootDisciplines, dateInterval);
        dispatch(fetchDisciplinesAll(selectedScheduleId ?? undefined));
        return true;
      } catch (err) {
        addToast(extractError(err), 'error');
        return false;
      }
    },
    [dispatch, getOrCreateScheduleId, rootDisciplines, scheduleList, selectedScheduleId, addToast],
  );

  // ── Обновление ─────────────────────────────────────────────────────────────

  const update = useCallback(
    async (updated: Discipline): Promise<boolean> => {
      dispatch(updateDisciplineLocally(updated));
      const scheduleId = await getOrCreateScheduleId();
      if (!scheduleId) return false;

      try {
        if (updated.isRoot) {
          // Загружаем актуальное состояние дисциплины с бэка, чтобы сохранить
          // существующие batches для типов, которые не менялись
          const { data: viewDto } = await academicDisciplineApi.getAcademicDiscipline({
            academicDisciplineId: updated.id,
          });
          const oldTypes = viewDto.allowedLessonTypes ?? [];
          const newTypes = updated.allowedLessonTypes ?? [];

          // Для каждого типа: null если удалён, [] если новый, иначе — текущие данные с бэка
          const resolveBatches = (
            type: import('../api').AcademicDisciplineType,
            batchKey: 'lectureLessonBatchInfos' | 'practiceLessonBatchInfos' | 'labLessonBatchInfos' | 'examLessonBatchInfos' | 'testLessonBatchInfos',
          ): import('../api').LessonBatchInfoSaveDto[] => {
            const isAllowed = newTypes.includes(type);
            if (!isAllowed) return [];             // тип удалён — пустой массив
            const wasAllowed = oldTypes.includes(type);
            if (!wasAllowed) return [];            // тип добавлен — пустой список
            const views = viewDto[batchKey]; // тип не менялся — сохраняем
            return (views ?? []).map((view) =>
                ({ ...view, studentGroupIds: view.studentGroups.map((sg) => sg.id) }));
          };

          const result = await dispatch(
            saveDisciplineOnServer({
              discipline: updated,
              isNew: false,
              dto: {
                id: updated.id,
                scheduleId,
                name: updated.name,
                semesterNumber: updated.semesterNumber ?? 1,
                academicDisciplineTargetType: 'General',
                allowedLessonTypes: newTypes,
                associatedNames: updated.associatedNames ?? [],
                lectureLessonBatchInfos:  resolveBatches('Lecture',  'lectureLessonBatchInfos'),
                practiceLessonBatchInfos: resolveBatches('Practice', 'practiceLessonBatchInfos'),
                labLessonBatchInfos:      resolveBatches('Lab',      'labLessonBatchInfos'),
                examLessonBatchInfos:     resolveBatches('Exam',     'examLessonBatchInfos'),
                testLessonBatchInfos:     resolveBatches('Test',     'testLessonBatchInfos'),
                comment: updated.comment,
              },
            }),
          );
          if (saveDisciplineOnServer.rejected.match(result)) {
            addToast((result.payload as string) || 'Не удалось сохранить дисциплину', 'error');
            return false;
          }
        } else if (updated._singleBatchEdit) {
          // Редактирование одного занятия — обновить только этот batch
          const selectedSchedule = scheduleList.find((sc) => sc.id === selectedScheduleId);
          const dateInterval = resolveDateInterval(updated.dateRange, selectedSchedule?.dateInterval);
          await saveSingleBatch(updated, scheduleId, rootDisciplines, dateInterval);
          dispatch(fetchDisciplinesAll(selectedScheduleId ?? undefined));
        } else {
          const selectedSchedule = scheduleList.find((sc) => sc.id === selectedScheduleId);
          const dateInterval = resolveDateInterval(updated.dateRange, selectedSchedule?.dateInterval);
          await saveAsPayload(updated, scheduleId, rootDisciplines, dateInterval);
          dispatch(fetchDisciplinesAll(selectedScheduleId ?? undefined));
        }
        return true;
      } catch (err) {
        addToast(extractError(err), 'error');
        return false;
      }
    },
    [dispatch, getOrCreateScheduleId, rootDisciplines, scheduleList, selectedScheduleId, addToast],
  );

  // ── Удаление ───────────────────────────────────────────────────────────────

  const remove = useCallback(
    (id: string) => {
      dispatch(removeDisciplineLocally(id));
      academicDisciplineApi.deleteAcademicDiscipline({ academicDisciplineId: id }).catch((err: unknown) => {
        dispatch(fetchDisciplinesAll(selectedScheduleId ?? undefined));
        addToast(extractError(err), 'error');
      });
    },
    [dispatch, addToast],
  );

  return {
    rootDisciplines,
    disciplines,
    loading,
    error,
    newlyCreatedId,
    add,
    addRoot,
    update,
    remove,
    refetch,
  };
}
