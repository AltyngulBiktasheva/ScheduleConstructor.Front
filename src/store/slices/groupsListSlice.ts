/**
 * Хранит список групп и потоков для страницы GroupsPage.
 *
 * Маппинг StudentGroupViewDto → Group / Stream:
 *   StudentGroupType.Thread  → Stream (поток)
 *   StudentGroupType.Group   → Group  (группа)
 *   StudentGroupType.SemiGroup → Group (подгруппа, трактуется как группа)
 *
 *   children (StudentGroupShortViewDto[]) → groupIds у потока
 *                                         → subgroups у группы
 *
 * API: SaveStudentGroup принимает scheduleId — пробрасывается в payload.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { studentGroupApi } from '../../api';
import type { Group, Stream } from '../../types/group';
import { MOCK_GROUPS, MOCK_STREAMS } from '../../mockData/groups';

// ─── State ───────────────────────────────────────────────────────────────────

interface GroupsListState {
  groups: Group[];
  streams: Stream[];
  loading: boolean;
  error: string | null;
}

const initialState: GroupsListState = {
  groups: [],
  streams: [],
  loading: false,
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

/**
 * Загружает все группы и потоки.
 * TODO: заменить моки на реальный endpoint когда появится GetStudentGroups (список).
 */
export const fetchGroupsAll = createAsyncThunk(
  'groupsList/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      await new Promise((r) => setTimeout(r, 0));
      return { groups: MOCK_GROUPS, streams: MOCK_STREAMS };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

/** Создаёт группу на сервере */
export const createGroupOnServer = createAsyncThunk(
  'groupsList/createGroup',
  async (
    { group, scheduleId }: { group: Group; scheduleId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data: newId } = await studentGroupApi.saveStudentGroup({
        scheduleId,
        name: group.name,
        semesterNumber: 1, // TODO: добавить семестр в тип Group
        studentGroupType: 'Group',
        cypher: group.id,
      });
      return { ...group, id: newId };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

/** Создаёт поток на сервере */
export const createStreamOnServer = createAsyncThunk(
  'groupsList/createStream',
  async (
    { stream, scheduleId }: { stream: Stream; scheduleId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data: newId } = await studentGroupApi.saveStudentGroup({
        scheduleId,
        name: stream.name,
        semesterNumber: 1,
        studentGroupType: 'Thread',
        cypher: stream.id,
        childIds: stream.groupIds,
      });
      return { ...stream, id: newId };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const groupsListSlice = createSlice({
  name: 'groupsList',
  initialState,
  reducers: {
    addGroupLocally(state, action: PayloadAction<Group>) {
      state.groups.push(action.payload);
      // добавляем id группы в соответствующий поток
      const stream = state.streams.find((s) => s.id === action.payload.streamId);
      if (stream && !stream.groupIds.includes(action.payload.id)) {
        stream.groupIds.push(action.payload.id);
      }
    },
    updateGroupLocally(state, action: PayloadAction<Group>) {
      const idx = state.groups.findIndex((g) => g.id === action.payload.id);
      if (idx === -1) return;
      const prev = state.groups[idx];
      state.groups[idx] = action.payload;
      // обновляем членство в потоках если streamId изменился
      if (prev.streamId !== action.payload.streamId) {
        const oldStream = state.streams.find((s) => s.id === prev.streamId);
        if (oldStream) oldStream.groupIds = oldStream.groupIds.filter((id) => id !== prev.id);
        const newStream = state.streams.find((s) => s.id === action.payload.streamId);
        if (newStream && !newStream.groupIds.includes(action.payload.id)) {
          newStream.groupIds.push(action.payload.id);
        }
      }
    },
    removeGroupLocally(state, action: PayloadAction<string>) {
      state.groups = state.groups.filter((g) => g.id !== action.payload);
      state.streams.forEach((s) => {
        s.groupIds = s.groupIds.filter((id) => id !== action.payload);
      });
    },
    addStreamLocally(state, action: PayloadAction<Stream>) {
      state.streams.push(action.payload);
    },
    updateStreamLocally(state, action: PayloadAction<Stream>) {
      const idx = state.streams.findIndex((s) => s.id === action.payload.id);
      if (idx !== -1) state.streams[idx] = action.payload;
    },
    removeStreamLocally(state, action: PayloadAction<string>) {
      state.streams = state.streams.filter((s) => s.id !== action.payload);
      state.groups = state.groups.filter((g) => g.streamId !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroupsAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupsAll.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload.groups;
        state.streams = action.payload.streams;
      })
      .addCase(fetchGroupsAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createGroupOnServer.fulfilled, (state, action) => {
        const idx = state.groups.findIndex((g) => g.id === action.meta.arg.group.id);
        if (idx !== -1) state.groups[idx] = action.payload;
      })
      .addCase(createStreamOnServer.fulfilled, (state, action) => {
        const idx = state.streams.findIndex((s) => s.id === action.meta.arg.stream.id);
        if (idx !== -1) state.streams[idx] = action.payload;
      });
  },
});

export const {
  addGroupLocally,
  updateGroupLocally,
  removeGroupLocally,
  addStreamLocally,
  updateStreamLocally,
  removeStreamLocally,
} = groupsListSlice.actions;
export default groupsListSlice.reducer;
