/**
 * Хранит список преподавателей для страницы TeachersPage.
 * Отдельно от teacherSlice (который хранит одну детальную запись).
 *
 * Маппинг TeacherViewDto → Teacher:
 *   fullname → name
 *   wishes   → emptyWishes() (пожелания грузятся отдельно через teacherPreferenceSlice)
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { teacherApi } from '../../api';
import type { Teacher } from '../../types/teacher';
import { emptyWishes } from '../../types/teacher';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * API возвращает TeacherViewDto для одного преподавателя.
 * Список преподавателей в Swagger не предусмотрен — используем моки
 * как начальные данные, а saveTeacher синхронизирует изменения с сервером.
 *
 * Когда бэкенд добавит GET /Teacher/GetTeachers — заменить тело thunk на реальный запрос.
 */
import { MOCK_TEACHERS } from '../../mockData/teachers';

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

/**
 * Загружает список преподавателей.
 * Сейчас использует моковые данные — когда бэкенд добавит endpoint списка,
 * достаточно заменить строку с MOCK_TEACHERS на реальный API-вызов.
 */
export const fetchTeachersAll = createAsyncThunk(
  'teachersList/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: заменить на реальный запрос, когда бэкенд добавит GET /Teacher/GetTeachers
      // const { data } = await teacherApi.getTeachers();
      // return data.map(mapDtoToTeacher);
      await new Promise((r) => setTimeout(r, 0)); // имитируем async
      return MOCK_TEACHERS;
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

/**
 * Создаёт нового преподавателя на сервере.
 * Принимает фронтовый Teacher, отправляет SaveTeacherDto, возвращает UUID.
 */
export const createTeacherOnServer = createAsyncThunk(
  'teachersList/create',
  async (teacher: Teacher, { rejectWithValue }) => {
    try {
      const { data: newId } = await teacherApi.saveTeacher({ fullname: teacher.name });
      return { ...teacher, id: newId };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const teachersListSlice = createSlice({
  name: 'teachersList',
  initialState,
  reducers: {
    /** Оптимистично добавляет преподавателя в список (вызывать вместе с createTeacherOnServer) */
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
      })
      // После успешного создания на сервере — обновляем id на серверный UUID
      .addCase(createTeacherOnServer.fulfilled, (state, action) => {
        const idx = state.teachers.findIndex((t) => t.id === action.meta.arg.id);
        if (idx !== -1) state.teachers[idx] = action.payload;
      });
  },
});

export const { addTeacherLocally, updateTeacherLocally, removeTeacherLocally } =
  teachersListSlice.actions;
export default teachersListSlice.reducer;
