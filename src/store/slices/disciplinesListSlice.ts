/**
 * Хранит список дисциплин для страницы DisciplinesPage.
 *
 * Маппинг AcademicDisciplineViewDto → Discipline:
 *   Фронтовый тип Discipline значительно богаче DTO.
 *   При загрузке с сервера поля расписания (dayId, timeStart, occurrences и т.д.)
 *   будут отсутствовать — это нормально, они заполняются в конструкторе расписания.
 *
 * scheduleId: требуется для API — берётся из store.schedule.list[0].id
 * (TODO: когда появится выбор расписания — пробрасывать явно).
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { academicDisciplineApi } from '../../api';
import type { Discipline } from '../../types/discipline';
import { MOCK_DISCIPLINES_LIST } from '../../mockData/disciplines';

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

/**
 * Загружает список дисциплин.
 * API предоставляет только GetAcademicDiscipline (одна запись по id).
 * TODO: когда появится endpoint списка — заменить моки на реальный вызов.
 */
export const fetchDisciplinesAll = createAsyncThunk(
  'disciplinesList/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: заменить на реальный запрос
      // const { data } = await academicDisciplineApi.getAcademicDisciplines({ scheduleId });
      // return data.map(mapDtoToDiscipline);
      await new Promise((r) => setTimeout(r, 0));
      return MOCK_DISCIPLINES_LIST;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

/**
 * Сохраняет дисциплину на сервере.
 * scheduleId передаётся в payload — его нужно получить из активного расписания.
 */
export const saveDisciplineOnServer = createAsyncThunk(
  'disciplinesList/save',
  async (
    { discipline, scheduleId }: { discipline: Discipline; scheduleId: string },
    { rejectWithValue },
  ) => {
    try {
      await academicDisciplineApi.saveAcademicDiscipline({
        id: discipline.id,
        scheduleId,
        name: discipline.name,
        cypher: discipline.id, // фронт не имеет отдельного поля cypher — используем id
        semester: 1,           // TODO: добавить semester в фронтовый тип Discipline
        academicDisciplineTargetType: 'General',
        hasExam: false,
        hasTest: false,
        comment: discipline.comment,
      });
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
      })
      .addCase(saveDisciplineOnServer.fulfilled, (state, action) => {
        const idx = state.disciplines.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.disciplines[idx] = action.payload;
      });
  },
});

export const { addDisciplineLocally, updateDisciplineLocally, removeDisciplineLocally } =
  disciplinesListSlice.actions;
export default disciplinesListSlice.reducer;
