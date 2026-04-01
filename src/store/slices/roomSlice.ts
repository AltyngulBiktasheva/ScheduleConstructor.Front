import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { roomApi } from '../../api';
import type { RoomTreeDto, RoomViewDto, SaveRoomDto } from '../../api';
import { useAppDispatch, useAppSelector } from '../hooks';

// ─── State ────────────────────────────────────────────────────────────────────

interface RoomState {
  current: RoomViewDto | null;
  tree: RoomTreeDto[] | null;
  loading: boolean;
  treeLoading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: RoomState = {
  current: null,
  tree: null as RoomTreeDto[] | null,
  loading: false,
  treeLoading: false,
  saving: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchRoom = createAsyncThunk(
  'room/fetch',
  async (params: { roomId: string }, { rejectWithValue }) => {
    try {
      const { data } = await roomApi.getRoom(params);
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const fetchRoomTree = createAsyncThunk(
  'room/fetchTree',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await roomApi.getRoomTree();
      return data;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

export const saveRoom = createAsyncThunk(
  'room/save',
  async (dto: SaveRoomDto, { rejectWithValue }) => {
    try {
      await roomApi.saveRoom(dto);
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    clearRoom(state) {
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchTree
      .addCase(fetchRoomTree.pending, (state) => {
        state.treeLoading = true;
        state.error = null;
      })
      .addCase(fetchRoomTree.fulfilled, (state, action) => {
        state.treeLoading = false;
        state.tree = action.payload;
      })
      .addCase(fetchRoomTree.rejected, (state, action) => {
        state.treeLoading = false;
        state.error = action.payload as string;
      })
      // save
      .addCase(saveRoom.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveRoom.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveRoom.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearRoom } = roomSlice.actions;
export default roomSlice.reducer;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useRoom = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.room);

  return {
    ...state,
    fetch: (params: { roomId: string }) => dispatch(fetchRoom(params)),
    fetchTree: () => dispatch(fetchRoomTree()),
    save: (dto: SaveRoomDto) => dispatch(saveRoom(dto)),
    clear: () => dispatch(clearRoom()),
  };
};
