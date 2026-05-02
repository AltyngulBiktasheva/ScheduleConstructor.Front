import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { teacherPreferenceApi } from '../../api';
import type { SaveTeacherPreferenceDto, TeacherPreferencesViewDto } from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';
import { extractError } from '../../utils/extractError';

// ─── State ────────────────────────────────────────────────────────────────────

interface TeacherPreferenceState {
  current: TeacherPreferencesViewDto | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: TeacherPreferenceState = {
  current: null,
  loading: false,
  saving: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchTeacherPreferences = createAsyncThunk(
  'teacherPreference/fetch',
  async (params: { teacherId: string; scheduleId: string }, { rejectWithValue }) => {
    try {
      const { data } = await teacherPreferenceApi.getTeacherPreferences(params);
      return data;
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const saveTeacherPreference = createAsyncThunk(
  'teacherPreference/save',
  async (dto: SaveTeacherPreferenceDto, { rejectWithValue }) => {
    try {
      await teacherPreferenceApi.saveTeacherPreference(dto);
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const teacherPreferenceSlice = createSlice({
  name: 'teacherPreference',
  initialState,
  reducers: {
    clearTeacherPreference(state) {
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchTeacherPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchTeacherPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // save
      .addCase(saveTeacherPreference.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveTeacherPreference.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveTeacherPreference.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTeacherPreference } = teacherPreferenceSlice.actions;
export default teacherPreferenceSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTeacherPreference = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.teacherPreference);

  return {
    ...state,
    fetch: (params: { teacherId: string; scheduleId: string }) =>
      dispatch(fetchTeacherPreferences(params)),
    save: (dto: SaveTeacherPreferenceDto) => dispatch(saveTeacherPreference(dto)),
    clear: () => dispatch(clearTeacherPreference()),
  };
};
