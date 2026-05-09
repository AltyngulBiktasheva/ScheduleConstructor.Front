/**
 * Хранит список дисциплин для страницы DisciplinesPage.
 *
 * Корневые дисциплины (isRoot=true): шаблоны, загружаются напрямую из DTO.
 * Дочерние дисциплины (isRoot=false): извлекаются из lecturePayload / practicePayload / labPayload.
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
import type { Discipline } from '../../types/discipline';
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

/** Маппинг типов с payload-полем */
const PAYLOAD_KEY_MAP: Partial<Record<AcademicDisciplineType, 'lecturePayload' | 'practicePayload' | 'labPayload' | 'examPayload' | 'testPayload'>> = {
  Lecture:  'lecturePayload',
  Practice: 'practicePayload',
  Lab:      'labPayload',
  Exam:     'examPayload',
  Test:     'testPayload',
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
    forIds: batch.studentGroupIds ?? [],
    canOverlap: batch.allowCombining ?? false,
    repeat: mapRepeatTypeReverse(batch.repeatType) as RepeatType,
    occurrences: (batch.dayOfWeekTimeIntervals ?? []).map((dwt) => ({
      dayId: DOW_TO_DAY[dwt.dayOfWeek] ?? 'mon',
      timeStart: dwt.timeInterval.timeFrom.slice(0, 5),
      timeEnd: dwt.timeInterval.timeTo.slice(0, 5),
    })),
    weeklyCount: (batch.dayOfWeekTimeIntervals ?? []).length || 1,
    dateRange: batch.dateInterval?.dateFrom
      ? { from: apiToDisplayDate(batch.dateInterval.dateFrom), to: apiToDisplayDate(batch.dateInterval.dateTo) }
      : undefined,
    teachers: (batch.teacherIds ?? []).map((id) => ({ id, name: '' })),
    audiences: (batch.roomIds ?? []).map((id) => ({ roomId: id })),
    roomId: batch.roomIds?.[0] ?? undefined,
  };
}

function mapDto(dto: AcademicDisciplineRegistryItemDto): { root: Discipline; children: Discipline[] } {
  const root: Discipline = {
    id: dto.id,
    name: dto.name,
    isRoot: true,
    semesterNumber: dto.semesterNumber,
    allowedLessonTypes: dto.allowedLessonTypes,
    forType: 'group',
    forIds: [],
    teachers: [],
    audiences: [],
    isStatic: false,
    canOverlap: false,
    repeat: 'every-week',
    weeklyCount: 1,
    comment: dto.comment ?? undefined,
  };

  const children: Discipline[] = [];

  for (const type of dto.allowedLessonTypes) {
    const childName = `${dto.name} (${LESSON_TYPE_LABELS[type] ?? type})`;
    const payloadKey = PAYLOAD_KEY_MAP[type];
    const payload = payloadKey ? dto[payloadKey] : undefined;

    if (payload?.lessonBatchInfos?.length) {
      // Есть сохранённый payload — показываем из него
      const [firstBatch, ...restBatches] = payload.lessonBatchInfos;
      const firstFields = mapBatchToFields(firstBatch);

      const extraCopies: Partial<Discipline>[] = restBatches.map((batch) => ({
        lessonId: batch.id ?? undefined,
        ...mapBatchToFields(batch),
        totalHoursCount: batch.hoursCost,
      }));

      children.push({
        id: firstBatch.id ?? `${dto.id}_${type}`,
        lessonId: firstBatch.id ?? undefined,
        name: childName,
        isRoot: false,
        parentId: dto.id,
        academicDisciplineId: dto.id,
        lessonType: type,
        totalHoursCount: payload.totalHoursCount,
        forType: 'group',
        isStatic: false,   // TODO: Тип дисциплины (isStatic) — ожидаем реализацию на бэке
        comment: dto.comment ?? undefined,
        ...firstFields,
        extraCopies: extraCopies.length > 0 ? extraCopies : undefined,
      });
    } else {
      // Payload пуст или отсутствует — показываем placeholder
      children.push({
        id: `${dto.id}_${type}`,
        name: childName,
        isRoot: false,
        parentId: dto.id,
        academicDisciplineId: dto.id,
        lessonType: type,
        totalHoursCount: undefined,
        forType: 'group',
        forIds: [],
        teachers: [],
        audiences: [],
        isStatic: false,
        canOverlap: false,
        repeat: 'every-week',
        weeklyCount: 1,
        comment: dto.comment ?? undefined,
      });
    }
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
