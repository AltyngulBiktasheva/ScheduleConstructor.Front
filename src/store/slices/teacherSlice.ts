import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { teacherApi } from '../../api';
import type { SaveTeacherDto, TeacherViewDto } from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';

// ─── State ────────────────────────────────────────────────────────────────────

interface TeacherState {
  current: TeacherViewDto | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: TeacherState = {
  current: null,
  loading: false,
  saving: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchTeacher = createAsyncThunk(
  'teacher/fetch',
  async (params: { teacherId: string }, { rejectWithValue }) => {
    try {
      const { data } = await teacherApi.getTeacher(params);
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const saveTeacher = createAsyncThunk(
  'teacher/save',
  async (dto: SaveTeacherDto, { rejectWithValue }) => {
    try {
      const { data } = await teacherApi.saveTeacher(dto);
      return data; // UUID преподавателя
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const teacherSlice = createSlice({
  name: 'teacher',
  initialState,
  reducers: {
    clearTeacher(state) {
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchTeacher.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacher.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchTeacher.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // save
      .addCase(saveTeacher.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveTeacher.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveTeacher.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTeacher } = teacherSlice.actions;
export default teacherSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTeacher = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.teacher);

  return {
    ...state,
    fetch: (params: { teacherId: string }) => dispatch(fetchTeacher(params)),
    save: (dto: SaveTeacherDto) => dispatch(saveTeacher(dto)),
    clear: () => dispatch(clearTeacher()),
  };
};
