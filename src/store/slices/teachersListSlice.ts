/**
 * Хранит список преподавателей для страницы TeachersPage.
 * Отдельно от teacherSlice (который хранит одну детальную запись).
 *
 * Маппинг TeacherRegistryItemDto → Teacher:
 *   fullname → name
 *   wishes   → emptyWishes() (пожелания грузятся отдельно через teacherPreferenceSlice)
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { teacherApi } from '../../api';
import type { Teacher } from '../../types/teacher';
import { emptyWishes } from '../../types/teacher';
import { extractError } from '../../utils/extractError';

// ─── State ───────────────────────────────────────────────────────────────────

interface TeachersListState {
  teachers: Teacher[];
  loading: boolean;
  error: string | null;
  page: number;
  itemsPerPage: number;
  totalItems: number;
}

const initialState: TeachersListState = {
  teachers: [],
  loading: false,
  error: null,
  page: 1,
  itemsPerPage: 100,
  totalItems: 0,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

/** Загружает список преподавателей с бэкенда (с пагинацией) */
export const fetchTeachersAll = createAsyncThunk(
  'teachersList/fetchAll',
  async (params: { page?: number; itemsPerPage?: number } | undefined, { rejectWithValue }) => {
    try {
      const { data } = await teacherApi.searchTeachers({
        searchParameters: { page: params?.page ?? 1, itemsPerPage: params?.itemsPerPage ?? 100 },
      });
      return {
        teachers: data.items.map((dto) => ({
          id: dto.id,
          name: dto.fullname,
          contacts: dto.contacts ?? undefined,
          wishes: emptyWishes(),
        })),
        totalItems: data.itemsCount,
      };
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

/**
 * Создаёт / обновляет преподавателя на сервере.
 * При создании (isNew=true) id не передаётся — генерируется на бэке.
 * После создания перезагружает список, чтобы получить реальный id.
 */
export const saveTeacherOnServer = createAsyncThunk(
  'teachersList/save',
  async ({ teacher, isNew }: { teacher: Teacher; isNew: boolean }, { dispatch, rejectWithValue }) => {
    try {
      await teacherApi.saveTeacher({
        id: isNew ? undefined : teacher.id,
        fullname: teacher.name,
        contacts: teacher.contacts,
      });
      if (isNew) dispatch(fetchTeachersAll());
      return teacher;
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const teachersListSlice = createSlice({
  name: 'teachersList',
  initialState,
  reducers: {
    /** Оптимистично добавляет преподавателя в список */
    addTeacherLocally(state, action: PayloadAction<Teacher>) {
      state.teachers.push(action.payload);
    },
    updateTeacherLocally(state, action: PayloadAction<Teacher>) {
      const idx = state.teachers.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.teachers[idx] = action.payload;
    },
    removeTeacherLocally(state, action: PayloadAction<string>) {
      state.teachers = state.teachers.filter((t) => t.id !== action.payload);
    },
    setTeachersPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setTeachersItemsPerPage(state, action: PayloadAction<number>) {
      state.itemsPerPage = action.payload;
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeachersAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeachersAll.fulfilled, (state, action) => {
        state.loading = false;
        state.teachers = action.payload.teachers;
        state.totalItems = action.payload.totalItems;
      })
      .addCase(fetchTeachersAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addTeacherLocally, updateTeacherLocally, removeTeacherLocally,
  setTeachersPage, setTeachersItemsPerPage,
} = teachersListSlice.actions;
export default teachersListSlice.reducer;
