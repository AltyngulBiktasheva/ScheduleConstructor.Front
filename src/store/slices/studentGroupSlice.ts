import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { studentGroupApi } from '../../api';
import type { SaveStudentGroupDto, StudentGroupViewDto } from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';

// ─── State ────────────────────────────────────────────────────────────────────

interface StudentGroupState {
  current: StudentGroupViewDto | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: StudentGroupState = {
  current: null,
  loading: false,
  saving: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchStudentGroup = createAsyncThunk(
  'studentGroup/fetch',
  async (params: { studentGroupId: string }, { rejectWithValue }) => {
    try {
      const { data } = await studentGroupApi.getStudentGroup(params);
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const saveStudentGroup = createAsyncThunk(
  'studentGroup/save',
  async (dto: SaveStudentGroupDto, { rejectWithValue }) => {
    try {
      await studentGroupApi.saveStudentGroup(dto);
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const studentGroupSlice = createSlice({
  name: 'studentGroup',
  initialState,
  reducers: {
    clearStudentGroup(state) {
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchStudentGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchStudentGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // save
      .addCase(saveStudentGroup.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveStudentGroup.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveStudentGroup.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearStudentGroup } = studentGroupSlice.actions;
export default studentGroupSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useStudentGroup = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.studentGroup);

  return {
    ...state,
    fetch: (params: { studentGroupId: string }) =>
      dispatch(fetchStudentGroup(params)),
    save: (dto: SaveStudentGroupDto) => dispatch(saveStudentGroup(dto)),
    clear: () => dispatch(clearStudentGroup()),
  };
};
