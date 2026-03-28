import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { scheduleApi } from '../../api';
import type { SaveScheduleDto, ScheduleDto } from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';

// ─── State ────────────────────────────────────────────────────────────────────

interface ScheduleState {
  list: ScheduleDto[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: ScheduleState = {
  list: [],
  loading: false,
  saving: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchSchedules = createAsyncThunk(
  'schedule/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await scheduleApi.searchSchedules();
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const saveSchedule = createAsyncThunk(
  'schedule/save',
  async (dto: SaveScheduleDto, { rejectWithValue }) => {
    try {
      const { data } = await scheduleApi.saveSchedule(dto);
      return data; // UUID нового расписания
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    clearScheduleError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // save
      .addCase(saveSchedule.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveSchedule.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveSchedule.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearScheduleError } = scheduleSlice.actions;
export default scheduleSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useSchedule = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.schedule);

  return {
    ...state,
    fetchAll: () => dispatch(fetchSchedules()),
    save: (dto: SaveScheduleDto) => dispatch(saveSchedule(dto)),
    clearError: () => dispatch(clearScheduleError()),
  };
};
