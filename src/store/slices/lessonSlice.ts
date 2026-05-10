import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { lessonApi } from '../../api';
import type {
  LessonViewDto,
  LessonWeekConflictDto,
  LessonShortDto,
  LessonSaveDto,
} from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';
import { extractError } from '../../utils/extractError';

// ─── State ────────────────────────────────────────────────────────────────────

interface LessonState {
  current: LessonViewDto | null;
  weekLessons: LessonShortDto[];
  weekConflicts: LessonWeekConflictDto[];
  loading: boolean;
  weekLessonsLoading: boolean;
  saving: boolean;
  deleting: boolean;
  conflictsLoading: boolean;
  error: string | null;
}

const initialState: LessonState = {
  current: null,
  weekLessons: [],
  weekConflicts: [],
  loading: false,
  weekLessonsLoading: false,
  saving: false,
  deleting: false,
  conflictsLoading: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchLesson = createAsyncThunk(
  'lesson/fetch',
  async (params: { lessonId: string }, { rejectWithValue }) => {
    try {
      const { data } = await lessonApi.getLesson(params);
      return data;
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const fetchWeekLessons = createAsyncThunk(
  'lesson/fetchWeek',
  async (
    params: { scheduleId: string; dateFrom: string; dateTo: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await lessonApi.searchWeekLessons(params);
      return data;
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const saveLesson = createAsyncThunk(
  'lesson/save',
  async (dto: LessonSaveDto, { rejectWithValue }) => {
    try {
      await lessonApi.saveLesson(dto);
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const deleteWeekLesson = createAsyncThunk(
  'lesson/delete',
  async (params: { scheduleId: string; lessonId: string }, { rejectWithValue }) => {
    try {
      await lessonApi.deleteLesson(params);
      return params.lessonId;
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const fetchLessonWeekConflicts = createAsyncThunk(
  'lesson/fetchWeekConflicts',
  async (
    params: { lessonId: string; dateFrom: string; dateTo: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await lessonApi.getLessonWeekConflicts(params);
      return data;
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
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
    clearWeekLessons(state) {
      state.weekLessons = [];
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(fetchWeekLessons.pending, (state) => {
        state.weekLessonsLoading = true;
        state.error = null;
      })
      .addCase(fetchWeekLessons.fulfilled, (state, action) => {
        state.weekLessonsLoading = false;
        state.weekLessons = action.payload;
      })
      .addCase(fetchWeekLessons.rejected, (state, action) => {
        state.weekLessonsLoading = false;
        state.error = action.payload as string;
      })
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
      .addCase(deleteWeekLesson.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteWeekLesson.fulfilled, (state, action) => {
        state.deleting = false;
        state.weekLessons = state.weekLessons.filter((l) => l.id !== action.payload);
      })
      .addCase(deleteWeekLesson.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload as string;
      })
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

export const { clearLesson, clearWeekConflicts, clearWeekLessons } = lessonSlice.actions;
export default lessonSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useLesson = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.lesson);

  return {
    ...state,
    fetch: (params: { lessonId: string }) =>
      dispatch(fetchLesson(params)),
    fetchWeek: (params: { scheduleId: string; dateFrom: string; dateTo: string }) =>
      dispatch(fetchWeekLessons(params)),
    save: (dto: LessonSaveDto) =>
      dispatch(saveLesson(dto)),
    delete: (params: { scheduleId: string; lessonId: string }) =>
      dispatch(deleteWeekLesson(params)),
    fetchWeekConflicts: (params: { lessonId: string; dateFrom: string; dateTo: string }) =>
      dispatch(fetchLessonWeekConflicts(params)),
    clear: () => dispatch(clearLesson()),
    clearConflicts: () => dispatch(clearWeekConflicts()),
    clearWeek: () => dispatch(clearWeekLessons()),
  };
};
