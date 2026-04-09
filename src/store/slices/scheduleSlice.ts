import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { scheduleApi } from '../../api';
import type { SaveScheduleDto, ScheduleRegistryItemDto } from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';

// ─── State ────────────────────────────────────────────────────────────────────

interface ScheduleState {
  list: ScheduleRegistryItemDto[];
  selectedScheduleId: string | null;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  error: string | null;
}

const initialState: ScheduleState = {
  list: [],
  selectedScheduleId: null,
  loading: false,
  saving: false,
  deleting: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchSchedules = createAsyncThunk(
  'schedule/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await scheduleApi.searchSchedules();
      return data.items;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const saveSchedule = createAsyncThunk(
  'schedule/save',
  async (dto: SaveScheduleDto, { dispatch, rejectWithValue }) => {
    try {
      await scheduleApi.saveSchedule(dto);
      dispatch(fetchSchedules());
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const deleteSchedule = createAsyncThunk(
  'schedule/delete',
  async (scheduleId: string, { dispatch, rejectWithValue }) => {
    try {
      await scheduleApi.deleteSchedule(scheduleId);
      dispatch(fetchSchedules());
      return scheduleId;
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
    setSelectedScheduleId(state, action: { payload: string | null }) {
      state.selectedScheduleId = action.payload;
    },
    clearScheduleError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        // Авто-выбор первого расписания если ни одно не выбрано
        if (!state.selectedScheduleId && action.payload.length > 0) {
          state.selectedScheduleId = action.payload[0].id;
        }
        // Если выбранное расписание было удалено — сбросить выбор
        if (state.selectedScheduleId && !action.payload.find((s) => s.id === state.selectedScheduleId)) {
          state.selectedScheduleId = action.payload[0]?.id ?? null;
        }
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
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
      })
      .addCase(deleteSchedule.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteSchedule.fulfilled, (state) => {
        state.deleting = false;
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedScheduleId, clearScheduleError } = scheduleSlice.actions;
export default scheduleSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useSchedule = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.schedule);

  return {
    ...state,
    fetchAll: () => dispatch(fetchSchedules()),
    save: (dto: SaveScheduleDto) => dispatch(saveSchedule(dto)),
    delete: (id: string) => dispatch(deleteSchedule(id)),
    selectSchedule: (id: string | null) => dispatch(setSelectedScheduleId(id)),
    clearError: () => dispatch(clearScheduleError()),
  };
};
