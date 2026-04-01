/**
 * Хранит список дисциплин для страницы DisciplinesPage.
 *
 * Маппинг AcademicDisciplineRegistryItemDto → Discipline:
 *   Фронтовый тип Discipline значительно богаче DTO.
 *   При загрузке с сервера поля расписания (dayId, timeStart, occurrences и т.д.)
 *   будут отсутствовать — это нормально, они заполняются в конструкторе расписания.
 *
 * scheduleId: требуется для сохранения — берётся из аргумента saveDto.
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
 * Сохраняет дисциплину на сервере.
 * Принимает готовый SaveAcademicDisciplineDto, чтобы вызывающий код мог указать scheduleId.
 */
export const saveDisciplineOnServer = createAsyncThunk(
  'disciplinesList/save',
  async (
    { discipline, dto }: { discipline: Discipline; dto: SaveAcademicDisciplineDto },
    { rejectWithValue },
  ) => {
    try {
      await academicDisciplineApi.saveAcademicDiscipline(dto);
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
