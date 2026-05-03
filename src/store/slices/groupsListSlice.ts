/**
 * Хранит список групп и потоков для страницы GroupsPage.
 *
 * Маппинг StudentGroupRegistryItemDto → Group / Stream:
 *   StudentGroupType.Thread  → Stream (поток)
 *   StudentGroupType.Group / SemiGroup → Group (группа)
 *
 * API: /student-group/search возвращает плоский список всех элементов.
 * API: SaveStudentGroup принимает scheduleId — пробрасывается в payload.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { studentGroupApi } from '../../api';
import type { SaveStudentGroupDto } from '../../api';
import type { Group, Stream } from '../../types/group';
import { extractError } from '../../utils/extractError';

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

/** Загружает плоский список групп и потоков с бэкенда */
export const fetchGroupsAll = createAsyncThunk(
  'groupsList/fetchAll',
  async (_: undefined, { rejectWithValue }) => {
    try {
      const { data } = await studentGroupApi.searchStudentGroups({
        searchParameters: { page: 1, itemsPerPage: 100 },
      });

      const streams: Stream[] = [];
      const groups: Group[] = [];

      for (const dto of data.items) {
        if (dto.studentGroupType === 'Thread') {
          streams.push({
            id: dto.id,
            name: dto.name,
            semesterNumber: dto.semesterNumber,
            groupIds: [],
            disciplineIds: [],
          });
        } else if (dto.studentGroupType === 'Group') {
          groups.push({
            id: dto.id,
            name: dto.name,
            streamIds: [],
            subgroups: [],
            studentCount: dto.studentsCount,
            disciplineIds: [],
          });
        }
      }

      return { groups, streams };
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
    }
  },
);

/**
 * Создаёт / обновляет студенческую группу / поток на сервере.
 * При создании (isNew=true) id не передаётся — генерируется на бэке.
 * После создания перезагружает список.
 */
export const saveStudentGroupOnServer = createAsyncThunk(
  'groupsList/saveGroup',
  async (
    { entity, dto, isNew }: { entity: Group | Stream; dto: SaveStudentGroupDto; isNew: boolean },
    { dispatch, rejectWithValue },
  ) => {
    try {
      await studentGroupApi.saveStudentGroup({
        ...dto,
        id: isNew ? undefined : dto.id,
      });
      if (isNew) dispatch(fetchGroupsAll());
      return entity;
    } catch (err: unknown) {
      return rejectWithValue(extractError(err));
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
      for (const streamId of (action.payload.streamIds ?? [])) {
        const stream = state.streams.find((s) => s.id === streamId);
        if (stream && !stream.groupIds.includes(action.payload.id)) {
          stream.groupIds.push(action.payload.id);
        }
      }
    },
    updateGroupLocally(state, action: PayloadAction<Group>) {
      const idx = state.groups.findIndex((g) => g.id === action.payload.id);
      if (idx === -1) return;
      const prev = state.groups[idx];
      state.groups[idx] = action.payload;
      const prevStreamIds = prev.streamIds ?? [];
      const newStreamIds = action.payload.streamIds ?? [];
      // Remove from streams that are no longer selected
      for (const streamId of prevStreamIds) {
        if (!newStreamIds.includes(streamId)) {
          const stream = state.streams.find((s) => s.id === streamId);
          if (stream) stream.groupIds = stream.groupIds.filter((id) => id !== prev.id);
        }
      }
      // Add to newly selected streams
      for (const streamId of newStreamIds) {
        if (!prevStreamIds.includes(streamId)) {
          const stream = state.streams.find((s) => s.id === streamId);
          if (stream && !stream.groupIds.includes(action.payload.id)) {
            stream.groupIds.push(action.payload.id);
          }
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
      // Remove the deleted stream from each group's streamIds
      state.groups = state.groups.map((g) =>
        g.streamIds?.includes(action.payload)
          ? { ...g, streamIds: g.streamIds.filter((id) => id !== action.payload) }
          : g,
      );
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
