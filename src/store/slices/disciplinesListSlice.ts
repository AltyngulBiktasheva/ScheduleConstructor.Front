/**
 * Хранит список дисциплин для страницы DisciplinesPage.
 *
 * Корневые дисциплины (isRoot=true): шаблоны, загружаются напрямую из DTO.
 * Дочерние дисциплины (isRoot=false): извлекаются из lectureLessonBatchInfos / practiceLessonBatchInfos / labLessonBatchInfos.
 *
 * Корневые сохраняются через /academic-discipline/save.
 * Дочерние сохраняются через /lesson/save.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { academicDisciplineApi } from '../../api';
import type {
  AcademicDisciplineSaveDto,
  AcademicDisciplineRegistryItemDto,
  AcademicDisciplineType,
  LessonBatchInfoDto,
  DisciplineLessonRepeatType,
} from '../../api';
import type { Discipline, DisciplineTeacher, DisciplineAudience } from '../../types/discipline';
import type { RepeatType } from '../../types/discipline';
import { LESSON_TYPE_LABELS } from '../../pages/disciplines/tabs/RootDisciplineForm';
import { extractError } from '../../utils/extractError';

// ─── State ───────────────────────────────────────────────────────────────────

interface DisciplinesListState {
  rootDisciplines: Discipline[];
  disciplines: Discipline[];           // дочерние (не корневые)
  loading: boolean;
  error: string | null;
}

const initialState: DisciplinesListState = {
  rootDisciplines: [],
  disciplines: [],
  loading: false,
  error: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Маппинг типов с полем batches */
const BATCH_KEY_MAP: Partial<Record<AcademicDisciplineType, 'lectureLessonBatchInfos' | 'practiceLessonBatchInfos' | 'labLessonBatchInfos' | 'examLessonBatchInfos' | 'testLessonBatchInfos'>> = {
  Lecture:  'lectureLessonBatchInfos',
  Practice: 'practiceLessonBatchInfos',
  Lab:      'labLessonBatchInfos',
  Exam:     'examLessonBatchInfos',
  Test:     'testLessonBatchInfos',
};

/** YYYY-MM-DD → DD.MM.YYYY */
function apiToDisplayDate(api: string): string {
  const [y, m, d] = api.split('-');
  return `${d}.${m}.${y}`;
}

const DOW_TO_DAY: Record<number, string> = {
  1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun',
};

function mapRepeatTypeReverse(rt: DisciplineLessonRepeatType): RepeatType {
  switch (rt) {
    case 'EvenWeeks': return 'even-weeks';
    case 'OddWeeks':  return 'odd-weeks';
    case 'Once':      return 'once';
    default:          return 'every-week';
  }
}

function mapBatchToFields(batch: LessonBatchInfoDto) {
  return {
    forIds: (batch.studentGroups ?? []).map((s) => s.id),
    forNames: (batch.studentGroups ?? []).map((s) => s.name ?? ''),
    canOverlap: batch.allowCombining ?? false,
    repeat: mapRepeatTypeReverse(batch.repeatType) as RepeatType,
    occurrences: (batch.dayOfWeekTimeIntervals ?? []).map((dwt) => ({
      id: dwt.id,
      dayId: DOW_TO_DAY[dwt.dayOfWeekTimeInterval.dayOfWeek] ?? 'mon',
      timeStart: dwt.dayOfWeekTimeInterval.timeInterval.timeFrom.slice(0, 5),
      timeEnd: dwt.dayOfWeekTimeInterval.timeInterval.timeTo.slice(0, 5),
    })),
    weeklyCount: batch.lessonsPerWeekCount ?? ((batch.dayOfWeekTimeIntervals ?? []).length || 1),
    isStatic: batch.flexibilityType === 'Fixed',
    dateRange: batch.dateInterval?.dateFrom
      ? { from: apiToDisplayDate(batch.dateInterval.dateFrom), to: apiToDisplayDate(batch.dateInterval.dateTo) }
      : undefined,
    teachers: (batch.teacherIds ?? []).map((id) => ({ id, name: '' })),
    audiences: (batch.roomIds ?? []).map((id) => ({ roomId: id })),
    roomIds: batch.roomIds,
  };
}

// ─── Dedupe helpers ─────────────────────────────────────────────────────────

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)];
}

function dedupeTeachers(teachers: DisciplineTeacher[]): DisciplineTeacher[] {
  const seen = new Set<string>();
  return teachers.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

function dedupeAudiences(audiences: DisciplineAudience[]): DisciplineAudience[] {
  const seen = new Set<string>();
  return audiences.filter((a) => {
    if (seen.has(a.roomId)) return false;
    seen.add(a.roomId);
    return true;
  });
}

// ─── mapDto ─────────────────────────────────────────────────────────────────

function mapDto(dto: AcademicDisciplineRegistryItemDto): { root: Discipline; children: Discipline[] } {
  const root: Discipline = {
    id: dto.id,
    name: dto.name,
    isRoot: true,
    semesterNumber: dto.semesterNumber,
    allowedLessonTypes: dto.allowedLessonTypes,
    roomIds: [],
    forType: 'group',
    forIds: [],
    teachers: [],
    audiences: [],
    isStatic: false,
    canOverlap: false,
    repeat: 'every-week',
    weeklyCount: 1,
    comment: dto.comment ?? undefined,
    associatedNames: dto.associatedNames ?? undefined,
  };

  const children: Discipline[] = [];

  for (const type of dto.allowedLessonTypes) {
    const childName = `${dto.name} (${LESSON_TYPE_LABELS[type] ?? type})`;
    const batchKey = BATCH_KEY_MAP[type];
    const batches = batchKey ? (dto[batchKey] ?? []) : [];

    if (batches.length === 0) {
      // Payload пуст или отсутствует — показываем placeholder
      children.push({
        id: `${dto.id}_${type}`,
        name: childName,
        isRoot: false,
        parentId: dto.id,
        academicDisciplineId: dto.id,
        lessonType: type,
        totalHoursCount: undefined,
        roomIds: [],
        forType: 'group',
        forIds: [],
        teachers: [],
        audiences: [],
        isStatic: false,
        canOverlap: false,
        repeat: 'every-week',
        weeklyCount: 1,
        batchTotal: 0,
        comment: dto.comment ?? undefined,
      });
      continue;
    }

    // Создаём Discipline для каждого batch
    const batchDisciplines: Discipline[] = batches.map((batch, idx) => {
      const fields = mapBatchToFields(batch);
      return {
        id: batch.id ?? `${dto.id}_${type}_${idx}`,
        lessonId: batch.id ?? undefined,
        name: childName,
        isRoot: false,
        parentId: dto.id,
        academicDisciplineId: dto.id,
        lessonType: type,
        totalHoursCount: batch.hoursCost ?? batch.totalHoursCount ?? undefined,
        forType: 'group' as const,
        comment: batch.comment ?? undefined,
        batchIndex: idx,
        batchTotal: batches.length,
        ...fields,
      };
    });

    // Одна строка-группа со сводной информацией
    const grouped: Discipline = {
      id: `${dto.id}_${type}`,
      name: childName,
      isRoot: false,
      parentId: dto.id,
      academicDisciplineId: dto.id,
      lessonType: type,
      roomIds: dedupe(batchDisciplines.flatMap((d) => d.roomIds)),
      forType: 'group',
      // Сводка: уникальные группы из всех batch-ей
      forIds: dedupe(batchDisciplines.flatMap((d) => d.forIds)),
      forNames: dedupe(batchDisciplines.flatMap((d) => d.forNames ?? []).filter(Boolean)),
      // Сводные поля от первого batch (для просмотра)
      isStatic: batchDisciplines[0].isStatic,
      canOverlap: batchDisciplines[0].canOverlap,
      repeat: batchDisciplines[0].repeat,
      weeklyCount: batchDisciplines[0].weeklyCount,
      teachers: dedupeTeachers(batchDisciplines.flatMap((d) => d.teachers)),
      audiences: dedupeAudiences(batchDisciplines.flatMap((d) => d.audiences)),
      comment: dto.comment ?? undefined,
      batchTotal: batchDisciplines.length,
    };

    if (batchDisciplines.length === 1) {
      // Один batch — копируем его данные напрямую (без аккордеона)
      grouped.lessonId = batchDisciplines[0].lessonId;
      grouped.roomIds = batchDisciplines[0].roomIds;
      grouped.occurrences = batchDisciplines[0].occurrences;
      grouped.dateRange = batchDisciplines[0].dateRange;
      grouped.totalHoursCount = batchDisciplines[0].totalHoursCount;
    } else {
      // Несколько batch-ей — аккордеон
      grouped.childBatches = batchDisciplines;
    }

    children.push(grouped);
  }

  return { root, children };
}

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const fetchDisciplinesAll = createAsyncThunk(
  'disciplinesList/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await academicDisciplineApi.searchAcademicDisciplines({
        searchParameters: { page: 1, itemsPerPage: 100 },
      });
      const rootDisciplines: Discipline[] = [];
      const disciplines: Discipline[] = [];
      for (const dto of data.items) {
        const { root, children } = mapDto(dto);
        rootDisciplines.push(root);
        disciplines.push(...children);
      }
      return { rootDisciplines, disciplines };
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const saveDisciplineOnServer = createAsyncThunk(
  'disciplinesList/save',
  async (
    { discipline, dto, isNew }: { discipline: Discipline; dto: AcademicDisciplineSaveDto; isNew: boolean },
    { dispatch, rejectWithValue },
  ) => {
    try {
      await academicDisciplineApi.saveAcademicDiscipline({
        ...dto,
        id: isNew ? undefined : dto.id,
      });
      if (isNew) dispatch(fetchDisciplinesAll());
      return discipline;
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const disciplinesListSlice = createSlice({
  name: 'disciplinesList',
  initialState,
  reducers: {
    addDisciplineLocally(state, action: PayloadAction<Discipline>) {
      if (action.payload.isRoot) {
        state.rootDisciplines.push(action.payload);
      } else {
        state.disciplines.push(action.payload);
      }
    },
    updateDisciplineLocally(state, action: PayloadAction<Discipline>) {
      if (action.payload.isRoot) {
        const idx = state.rootDisciplines.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.rootDisciplines[idx] = action.payload;
      } else {
        const idx = state.disciplines.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.disciplines[idx] = action.payload;
      }
    },
    removeDisciplineLocally(state, action: PayloadAction<string>) {
      state.rootDisciplines = state.rootDisciplines.filter((d) => d.id !== action.payload);
      state.disciplines = state.disciplines.filter((d) => d.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDisciplinesAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDisciplinesAll.fulfilled, (state, action) => {
        state.loading = false;
        state.rootDisciplines = action.payload.rootDisciplines;
        state.disciplines = action.payload.disciplines;
      })
      .addCase(fetchDisciplinesAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addDisciplineLocally, updateDisciplineLocally, removeDisciplineLocally } =
  disciplinesListSlice.actions;
export default disciplinesListSlice.reducer;
