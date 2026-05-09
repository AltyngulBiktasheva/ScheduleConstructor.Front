import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { academicDisciplineApi } from '../../api';
import type { AcademicDisciplineViewDto, AcademicDisciplineSaveDto } from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';

// ─── State ────────────────────────────────────────────────────────────────────

interface AcademicDisciplineState {
  current: AcademicDisciplineViewDto | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: AcademicDisciplineState = {
  current: null,
  loading: false,
  saving: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchAcademicDiscipline = createAsyncThunk(
  'academicDiscipline/fetch',
  async (params: { academicDisciplineId: string }, { rejectWithValue }) => {
    try {
      const { data } = await academicDisciplineApi.getAcademicDiscipline(params);
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const saveAcademicDiscipline = createAsyncThunk(
  'academicDiscipline/save',
  async (dto: AcademicDisciplineSaveDto, { rejectWithValue }) => {
    try {
      await academicDisciplineApi.saveAcademicDiscipline(dto);
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const academicDisciplineSlice = createSlice({
  name: 'academicDiscipline',
  initialState,
  reducers: {
    clearAcademicDiscipline(state) {
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchAcademicDiscipline.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcademicDiscipline.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchAcademicDiscipline.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // save
      .addCase(saveAcademicDiscipline.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveAcademicDiscipline.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveAcademicDiscipline.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAcademicDiscipline } = academicDisciplineSlice.actions;
export default academicDisciplineSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAcademicDiscipline = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.academicDiscipline);

  return {
    ...state,
    fetch: (params: { academicDisciplineId: string }) =>
      dispatch(fetchAcademicDiscipline(params)),
    save: (dto: AcademicDisciplineSaveDto) =>
      dispatch(saveAcademicDiscipline(dto)),
    clear: () => dispatch(clearAcademicDiscipline()),
  };
};
