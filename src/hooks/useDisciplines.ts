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
import { academicDisciplineApi } from '../api';
import { fetchSchedules, saveSchedule } from '../store/slices/scheduleSlice';
import type {
  AcademicDisciplinePayloadDto,
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

function buildLessonBatchInfo(
  discipline: Discipline,
  dateInterval: { dateFrom: string; dateTo: string },
): LessonBatchInfoDto {
  return {
    id: discipline.lessonId || undefined,
    studentGroupIds: discipline.forIds,
    teacherIds: discipline.teachers.map((t) => t.id),
    roomIds: discipline.roomId ? [discipline.roomId] : [],
    dayOfWeekTimeIntervals: discipline.occurrences?.length
      ? discipline.occurrences.map((occ) => ({
          dayOfWeek: DAY_ID_TO_DOW[occ.dayId] ?? 1,
          timeInterval: { timeFrom: padTime(occ.timeStart), timeTo: padTime(occ.timeEnd) },
        }))
      : null,
    repeatType: mapRepeatType(discipline.repeat),
    dateInterval,
    allowCombining: discipline.canOverlap,
    hoursCost: discipline.totalHoursCount ?? 0,
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
function payloadOrDefault(payload: AcademicDisciplinePayloadDto | null | undefined): AcademicDisciplinePayloadDto {
  return payload ?? { totalHoursCount: 0, lessonBatchInfos: [] };
}

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
  const allBatchInfos: LessonBatchInfoDto[] = [
    buildLessonBatchInfo(discipline, dateInterval),
    ...(discipline._extraBatches ?? []).map((extra) => {
      const extraDateInterval = resolveDateInterval(
        extra.dateRange,
        { dateFrom: dateInterval.dateFrom, dateTo: dateInterval.dateTo },
      );
      return buildLessonBatchInfo({ ...discipline, ...extra } as Discipline, extraDateInterval);
    }),
  ];

  const updatedPayload: AcademicDisciplinePayloadDto = {
    totalHoursCount: discipline.totalHoursCount ?? 0,
    lessonBatchInfos: allBatchInfos,
  };

  await academicDisciplineApi.saveAcademicDiscipline({
    id: parentId,
    scheduleId,
    name: viewDto.name ?? root?.name,
    semesterNumber: viewDto.semesterNumber ?? root?.semesterNumber ?? 1,
    academicDisciplineTargetType: viewDto.academicDisciplineTargetType,
    allowedLessonTypes: viewDto.allowedLessonTypes ?? root?.allowedLessonTypes,
    lecturePayload:  lessonType === 'Lecture'  ? updatedPayload : payloadOrDefault(viewDto.lecturePayload),
    practicePayload: lessonType === 'Practice' ? updatedPayload : payloadOrDefault(viewDto.practicePayload),
    labPayload:      lessonType === 'Lab'      ? updatedPayload : payloadOrDefault(viewDto.labPayload),
    examPayload:     lessonType === 'Exam'     ? updatedPayload : payloadOrDefault(viewDto.examPayload),
    testPayload:     lessonType === 'Test'     ? updatedPayload : payloadOrDefault(viewDto.testPayload),
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
    dispatch(fetchDisciplinesAll());
    dispatch(fetchSchedules());
  }, [dispatch]);

  const markCreated = (id: string) => {
    setNewlyCreatedId(id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  };

  const refetch = useCallback(() => dispatch(fetchDisciplinesAll()), [dispatch]);

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
        dispatch(fetchDisciplinesAll());
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
                allowedLessonTypes: updated.allowedLessonTypes ?? [],
                lecturePayload:  (updated.allowedLessonTypes ?? []).includes('Lecture')  ? { totalHoursCount: 0, lessonBatchInfos: [] } : null,
                practicePayload: (updated.allowedLessonTypes ?? []).includes('Practice') ? { totalHoursCount: 0, lessonBatchInfos: [] } : null,
                labPayload:      (updated.allowedLessonTypes ?? []).includes('Lab')      ? { totalHoursCount: 0, lessonBatchInfos: [] } : null,
                examPayload:     (updated.allowedLessonTypes ?? []).includes('Exam')     ? { totalHoursCount: 0, lessonBatchInfos: [] } : null,
                testPayload:     (updated.allowedLessonTypes ?? []).includes('Test')     ? { totalHoursCount: 0, lessonBatchInfos: [] } : null,
                comment: updated.comment,
              },
            }),
          );
          if (saveDisciplineOnServer.rejected.match(result)) {
            addToast((result.payload as string) || 'Не удалось сохранить дисциплину', 'error');
            return false;
          }
        } else {
          const selectedSchedule = scheduleList.find((sc) => sc.id === selectedScheduleId);
          const dateInterval = resolveDateInterval(updated.dateRange, selectedSchedule?.dateInterval);
          await saveAsPayload(updated, scheduleId, rootDisciplines, dateInterval);
          dispatch(fetchDisciplinesAll());
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
        dispatch(fetchDisciplinesAll());
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
