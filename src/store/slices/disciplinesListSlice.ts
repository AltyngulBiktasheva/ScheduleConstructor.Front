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
import type { SaveAcademicDisciplineDto, AcademicDisciplineRegistryItemDto, AcademicDisciplineType } from '../../api';
import type { Discipline } from '../../types/discipline';
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
      const batch = payload.lessonBatchInfos[0];
      children.push({
        id: batch.id ?? `${dto.id}_${type}`,
        lessonId: batch.id ?? undefined,
        name: childName,
        isRoot: false,
        parentId: dto.id,
        academicDisciplineId: dto.id,
        lessonType: type,
        totalHoursCount: payload.totalHoursCount,
        forType: 'group',
        forIds: batch.studentGroupIds ?? [],
        teachers: [],
        audiences: [],
        isStatic: false,
        canOverlap: batch.allowCombining ?? false,
        repeat: 'every-week',
        weeklyCount: 1,
        comment: dto.comment ?? undefined,
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
    { discipline, dto, isNew }: { discipline: Discipline; dto: SaveAcademicDisciplineDto; isNew: boolean },
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
