import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { scheduleApi } from '../../api';
import type { ScheduleSaveDto, ScheduleRegistryItemDto } from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';
import { extractError } from '../../utils/extractError';
import { useToast } from '../../components/Toast/ToastContext';

// ─── State ────────────────────────────────────────────────────────────────────

interface ScheduleState {
  list: ScheduleRegistryItemDto[];
  selectedScheduleId: string | null;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  error: string | null;
  page: number;
  itemsPerPage: number;
  totalItems: number;
}

const initialState: ScheduleState = {
  list: [],
  selectedScheduleId: null,
  loading: false,
  saving: false,
  deleting: false,
  error: null,
  page: 1,
  itemsPerPage: 100,
  totalItems: 0,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchSchedules = createAsyncThunk(
  'schedule/fetchAll',
  async (params: { page?: number; itemsPerPage?: number } | undefined, { rejectWithValue }) => {
    try {
      const { data } = await scheduleApi.searchSchedules({
        searchParameters: { page: params?.page ?? 1, itemsPerPage: params?.itemsPerPage ?? 100 },
      });
      return { items: data.items, totalItems: data.itemsCount };
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const saveSchedule = createAsyncThunk(
  'schedule/save',
  async (dto: ScheduleSaveDto, { dispatch, rejectWithValue }) => {
    try {
      await scheduleApi.saveSchedule(dto);
      dispatch(fetchSchedules());
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
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
      return rejectWithValue(extractError(err));
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
    setSchedulesPage(state, action: { payload: number }) {
      state.page = action.payload;
    },
    setSchedulesItemsPerPage(state, action: { payload: number }) {
      state.itemsPerPage = action.payload;
      state.page = 1;
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
        state.list = action.payload.items;
        state.totalItems = action.payload.totalItems;
        // Авто-выбор первого расписания если ни одно не выбрано
        if (!state.selectedScheduleId && action.payload.items.length > 0) {
          state.selectedScheduleId = action.payload.items[0].id;
        }
        // Если выбранное расписание было удалено — сбросить выбор
        if (state.selectedScheduleId && !action.payload.items.find((s) => s.id === state.selectedScheduleId)) {
          state.selectedScheduleId = action.payload.items[0]?.id ?? null;
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

export const { setSelectedScheduleId, clearScheduleError, setSchedulesPage, setSchedulesItemsPerPage } = scheduleSlice.actions;
export default scheduleSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useSchedule = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.schedule);
  const { addToast } = useToast();

  return {
    ...state,
    fetchAll: () => dispatch(fetchSchedules()),
    save: async (dto: ScheduleSaveDto): Promise<boolean> => {
      const result = await dispatch(saveSchedule(dto));
      if (saveSchedule.rejected.match(result)) {
        addToast((result.payload as string) || 'Не удалось сохранить расписание', 'error');
        return false;
      }
      return true;
    },
    delete: async (id: string): Promise<boolean> => {
      const result = await dispatch(deleteSchedule(id));
      if (deleteSchedule.rejected.match(result)) {
        addToast((result.payload as string) || 'Не удалось удалить расписание', 'error');
        return false;
      }
      return true;
    },
    selectSchedule: (id: string | null) => dispatch(setSelectedScheduleId(id)),
    clearError: () => dispatch(clearScheduleError()),
  };
};
