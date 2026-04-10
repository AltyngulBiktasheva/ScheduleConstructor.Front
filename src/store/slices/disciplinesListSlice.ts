/**
 * Хранит список дисциплин (корневых и дочерних) для страницы DisciplinesPage.
 *
 * Корневая дисциплина (isRoot=true): шаблон с набором допустимых видов занятий.
 * Дочерняя дисциплина (isRoot=false): конкретное занятие, ссылается на корневую через parentId.
 *
 * Обе сохраняются на бэке как AcademicDiscipline через /academic-discipline/save.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { academicDisciplineApi } from '../../api';
import type { SaveAcademicDisciplineDto } from '../../api';
import type { Discipline } from '../../types/discipline';

// ─── State ───────────────────────────────────────────────────────────────────

interface DisciplinesListState {
  disciplines: Discipline[];
  loading: boolean;
  error: string | null;
}

const initialState: DisciplinesListState = {
  disciplines: [],
  loading: false,
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

/** Загружает список дисциплин с бэкенда */
export const fetchDisciplinesAll = createAsyncThunk(
  'disciplinesList/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await academicDisciplineApi.searchAcademicDisciplines({
        searchParameters: { page: 1, itemsPerPage: 100 },
      });
      return data.items.map((dto): Discipline => ({
        id: dto.id,
        name: dto.name,
        // Если у дисциплины больше одного допустимого типа — считаем её корневой
        isRoot: dto.allowedLessonTypes.length !== 1,
        cypher: dto.cypher,
        semesterNumber: dto.semesterNumber,
        allowedLessonTypes: dto.allowedLessonTypes,
        lessonType: dto.allowedLessonTypes.length === 1 ? dto.allowedLessonTypes[0] : undefined,
        totalHoursCount:
          dto.lecturePayload?.totalHoursCount ??
          dto.practicePayload?.totalHoursCount ??
          dto.labPayload?.totalHoursCount ??
          undefined,
        forType: 'group',
        forIds: [],
        teachers: [],
        audiences: [],
        isStatic: false,
        canOverlap: false,
        repeat: 'every-week',
        weeklyCount: 1,
        comment: dto.comment ?? undefined,
      }));
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

/**
 * Сохраняет дисциплину (корневую или дочернюю) на сервере.
 * При создании (isNew=true) id не передаётся — генерируется на бэке.
 */
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
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const disciplinesListSlice = createSlice({
  name: 'disciplinesList',
  initialState,
  reducers: {
    addDisciplineLocally(state, action: PayloadAction<Discipline>) {
      state.disciplines.push(action.payload);
    },
    updateDisciplineLocally(state, action: PayloadAction<Discipline>) {
      const idx = state.disciplines.findIndex((d) => d.id === action.payload.id);
      if (idx !== -1) state.disciplines[idx] = action.payload;
    },
    removeDisciplineLocally(state, action: PayloadAction<string>) {
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
        state.disciplines = action.payload;
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
