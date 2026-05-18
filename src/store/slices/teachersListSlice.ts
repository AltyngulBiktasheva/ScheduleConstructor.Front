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
}

const initialState: TeachersListState = {
  teachers: [],
  loading: false,
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

/** Загружает список преподавателей с бэкенда */
export const fetchTeachersAll = createAsyncThunk(
  'teachersList/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await teacherApi.searchTeachersShort();
      return data.map((dto) => ({
        id: dto.id,
        name: dto.fullname,
        contacts: dto.contacts ?? undefined,
        wishes: emptyWishes(),
      }));
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeachersAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeachersAll.fulfilled, (state, action) => {
        state.loading = false;
        state.teachers = action.payload;
      })
      .addCase(fetchTeachersAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addTeacherLocally, updateTeacherLocally, removeTeacherLocally } =
  teachersListSlice.actions;
export default teachersListSlice.reducer;
