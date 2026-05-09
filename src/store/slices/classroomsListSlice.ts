/**
 * Хранит список аудиторий для страницы ClassroomsPage.
 *
 * Данные загружаются из POST /room/search.
 * Маппинг RoomRegistryItemDto → Classroom:
 *   campusName  → building   (для отображения)
 *   campusId    → campusId   (для сохранения на бэкенд)
 *   roomType    → type
 *   capacity    → capacity
 *   roomBoardType → boardType
 *   hasProjector  → hasProjector
 *
 * При создании через форму: campusId берётся из выбранного кампуса.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { roomApi } from '../../api';
import type { RoomType, RoomBoardType } from '../../api';
import type { Classroom, ClassroomType, BoardType } from '../../types/classroom';
import { extractError } from '../../utils/extractError';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROOM_TYPE_MAP: Record<RoomType, ClassroomType> = {
  Standard:     'standard',
  Multimedia:   'computer',
  Laboratory:   'laboratory',
  Amphitheater: 'amphitheater',
};

const BOARD_TYPE_MAP: Record<RoomBoardType, BoardType> = {
  Chalk:  'chalk',
  Marker: 'marker',
};

export const CLASSROOM_TYPE_REVERSE: Record<ClassroomType, RoomType> = {
  standard:     'Standard',
  computer:     'Multimedia',
  laboratory:   'Laboratory',
  amphitheater: 'Amphitheater',
};

export const BOARD_TYPE_REVERSE: Record<BoardType, RoomBoardType> = {
  chalk:  'Chalk',
  marker: 'Marker',
};

// ─── State ───────────────────────────────────────────────────────────────────

interface ClassroomsListState {
  classrooms: Classroom[];
  loading: boolean;
  error: string | null;
}

const initialState: ClassroomsListState = {
  classrooms: [],
  loading: false,
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

/** Загружает все аудитории через /room/search */
export const fetchClassroomsAll = createAsyncThunk(
  'classroomsList/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await roomApi.searchRooms({
        searchParameters: { page: 1, itemsPerPage: 100 },
      });
      return data.items.map((room): Classroom => ({
        id: room.id,
        name: room.name,
        building: room.campusName,
        campusId: room.campusId,
        type: room.roomType ? (ROOM_TYPE_MAP[room.roomType] ?? 'standard') : 'standard',
        capacity: room.capacity || null,
        boardType: room.roomBoardType ? (BOARD_TYPE_MAP[room.roomBoardType] ?? null) : null,
        hasProjector: room.hasProjector ?? null,
      }));
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

/**
 * Создаёт / обновляет аудиторию на сервере.
 * При создании (isNew=true) id не передаётся — генерируется на бэке.
 * После создания перезагружает список.
 */
export const saveClassroomOnServer = createAsyncThunk(
  'classroomsList/save',
  async (
    { classroom, isNew }: { classroom: Classroom; isNew: boolean },
    { dispatch, rejectWithValue },
  ) => {
    try {
      if (!classroom.campusId) throw new Error('Не выбран кампус для аудитории');
      await roomApi.saveRoom({
        id: isNew ? undefined : classroom.id,
        name: classroom.name,
        campusId: classroom.campusId,
        roomType: CLASSROOM_TYPE_REVERSE[classroom.type],
        capacity: classroom.capacity || null,
        roomBoardType: classroom.boardType != null ? BOARD_TYPE_REVERSE[classroom.boardType] : undefined,
        hasProjector: classroom.hasProjector ?? undefined,
      });
      if (isNew) dispatch(fetchClassroomsAll());
      return classroom;
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const classroomsListSlice = createSlice({
  name: 'classroomsList',
  initialState,
  reducers: {
    addClassroomLocally(state, action: PayloadAction<Classroom>) {
      state.classrooms.push(action.payload);
    },
    updateClassroomLocally(state, action: PayloadAction<Classroom>) {
      const idx = state.classrooms.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.classrooms[idx] = action.payload;
    },
    removeClassroomLocally(state, action: PayloadAction<string>) {
      state.classrooms = state.classrooms.filter((c) => c.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClassroomsAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassroomsAll.fulfilled, (state, action) => {
        state.loading = false;
        state.classrooms = action.payload;
      })
      .addCase(fetchClassroomsAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addClassroomLocally, updateClassroomLocally, removeClassroomLocally } =
  classroomsListSlice.actions;
export default classroomsListSlice.reducer;
