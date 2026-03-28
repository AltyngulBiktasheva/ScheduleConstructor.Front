/**
 * Хранит список аудиторий для страницы ClassroomsPage.
 *
 * Маппинг RoomViewDto → Classroom:
 *   roomType → type (Standard→standard, Multimedia→computer, Laboratory→laboratory, Amphitheater→amphitheater)
 *   campusId → building (временно сохраняется как id корпуса)
 *
 * Поля capacity / boardType / hasProjector отсутствуют в API — проставляются дефолтами.
 * При создании через форму все поля заполняются пользователем.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { roomApi } from '../../api';
import type { RoomType } from '../../api';
import type { Classroom, ClassroomType } from '../../types/classroom';
import { MOCK_CLASSROOMS } from '../../mockData/classrooms';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROOM_TYPE_MAP: Record<RoomType, ClassroomType> = {
  Standard: 'standard',
  Multimedia: 'computer',
  Laboratory: 'laboratory',
  Amphitheater: 'amphitheater',
};

const CLASSROOM_TYPE_REVERSE: Record<ClassroomType, RoomType> = {
  standard: 'Standard',
  computer: 'Multimedia',
  laboratory: 'Laboratory',
  amphitheater: 'Amphitheater',
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

/**
 * Загружает дерево аудиторий и плоско разворачивает его в список.
 * TODO: когда структура RoomTreeDto будет раскрыта в Swagger — заменить маппинг.
 */
export const fetchClassroomsAll = createAsyncThunk(
  'classroomsList/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: заменить на реальный запрос, когда RoomTreeDto будет наполнен
      // const { data } = await roomApi.getRoomTree();
      // return flattenRoomTree(data).map(mapDtoToClassroom);
      await new Promise((r) => setTimeout(r, 0));
      return MOCK_CLASSROOMS;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

/** Создаёт аудиторию на сервере и возвращает её с серверным UUID */
export const createClassroomOnServer = createAsyncThunk(
  'classroomsList/create',
  async (classroom: Classroom, { rejectWithValue }) => {
    try {
      const { data: newId } = await roomApi.saveRoom({
        name: classroom.name,
        campusId: classroom.building, // building хранит id корпуса
        roomType: CLASSROOM_TYPE_REVERSE[classroom.type],
      });
      return { ...classroom, id: newId };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
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
      })
      .addCase(createClassroomOnServer.fulfilled, (state, action) => {
        const idx = state.classrooms.findIndex((c) => c.id === action.meta.arg.id);
        if (idx !== -1) state.classrooms[idx] = action.payload;
      });
  },
});

export const { addClassroomLocally, updateClassroomLocally, removeClassroomLocally } =
  classroomsListSlice.actions;
export default classroomsListSlice.reducer;
