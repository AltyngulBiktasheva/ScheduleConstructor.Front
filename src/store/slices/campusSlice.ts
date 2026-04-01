import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { campusApi } from '../../api';
import type { CampusRegistryItemDto, SaveCampusDto } from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';

// ─── State ────────────────────────────────────────────────────────────────────

interface CampusState {
  list: CampusRegistryItemDto[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: CampusState = {
  list: [],
  loading: false,
  saving: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCampuses = createAsyncThunk(
  'campus/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await campusApi.searchCampuses();
      return data.items;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const saveCampus = createAsyncThunk(
  'campus/save',
  async (dto: SaveCampusDto, { dispatch, rejectWithValue }) => {
    try {
      await campusApi.saveCampus(dto);
      dispatch(fetchCampuses());
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const campusSlice = createSlice({
  name: 'campus',
  initialState,
  reducers: {
    clearCampusError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampuses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCampuses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveCampus.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveCampus.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveCampus.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCampusError } = campusSlice.actions;
export default campusSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCampus = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.campus);

  return {
    ...state,
    fetchAll: () => dispatch(fetchCampuses()),
    save: (dto: SaveCampusDto) => dispatch(saveCampus(dto)),
    clearError: () => dispatch(clearCampusError()),
  };
};
