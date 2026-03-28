import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { lessonApi } from '../../api';
import type { DateInterval, LessonViewDto, LessonWeekConflictDto, SaveLessonRequestDto } from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';

// ─── State ────────────────────────────────────────────────────────────────────

interface LessonState {
  current: LessonViewDto | null;
  weekConflicts: LessonWeekConflictDto[];
  loading: boolean;
  saving: boolean;
  conflictsLoading: boolean;
  error: string | null;
}

const initialState: LessonState = {
  current: null,
  weekConflicts: [],
  loading: false,
  saving: false,
  conflictsLoading: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchLesson = createAsyncThunk(
  'lesson/fetch',
  async (params: { lessonId: string; scheduleId: string }, { rejectWithValue }) => {
    try {
      const { data } = await lessonApi.getLesson(params);
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const saveLesson = createAsyncThunk(
  'lesson/save',
  async (dto: SaveLessonRequestDto, { rejectWithValue }) => {
    try {
      const { data } = await lessonApi.saveLesson(dto);
      return data; // UUID сохранённого занятия
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const fetchLessonWeekConflicts = createAsyncThunk(
  'lesson/fetchWeekConflicts',
  async (
    params: { lessonId: string; dateInterval: DateInterval },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await lessonApi.getLessonWeekConflicts(
        params.lessonId,
        params.dateInterval,
      );
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const lessonSlice = createSlice({
  name: 'lesson',
  initialState,
  reducers: {
    clearLesson(state) {
      state.current = null;
      state.error = null;
    },
    clearWeekConflicts(state) {
      state.weekConflicts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // save
      .addCase(saveLesson.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveLesson.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveLesson.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // weekConflicts
      .addCase(fetchLessonWeekConflicts.pending, (state) => {
        state.conflictsLoading = true;
        state.error = null;
      })
      .addCase(fetchLessonWeekConflicts.fulfilled, (state, action) => {
        state.conflictsLoading = false;
        state.weekConflicts = action.payload;
      })
      .addCase(fetchLessonWeekConflicts.rejected, (state, action) => {
        state.conflictsLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearLesson, clearWeekConflicts } = lessonSlice.actions;
export default lessonSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useLesson = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.lesson);

  return {
    ...state,
    fetch: (params: { lessonId: string; scheduleId: string }) =>
      dispatch(fetchLesson(params)),
    save: (dto: SaveLessonRequestDto) =>
      dispatch(saveLesson(dto)),
    fetchWeekConflicts: (params: { lessonId: string; dateInterval: DateInterval }) =>
      dispatch(fetchLessonWeekConflicts(params)),
    clear: () => dispatch(clearLesson()),
    clearConflicts: () => dispatch(clearWeekConflicts()),
  };
};
