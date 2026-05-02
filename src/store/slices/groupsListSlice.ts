/**
 * Хранит список групп и потоков для страницы GroupsPage.
 *
 * Маппинг StudentGroupRegistryItemDto → Group / Stream:
 *   StudentGroupType.Thread  → Stream (поток)
 *   StudentGroupType.Group / SemiGroup → Group (группа / подгруппа)
 *
 * API: SaveStudentGroup принимает scheduleId — пробрасывается в payload.
 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { studentGroupApi } from '../../api';
import type { SaveStudentGroupDto } from '../../api';
import type { Group, Stream } from '../../types/group';

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

/** Загружает дерево групп и потоков с бэкенда */
export const fetchGroupsAll = createAsyncThunk(
  'groupsList/fetchAll',
  async (_: undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { schedule: { selectedScheduleId: string | null } };
      const scheduleId = state.schedule.selectedScheduleId;
      if (!scheduleId) return { groups: [], streams: [] };

      // Шаг 1: получаем дерево (список корневых элементов с дочерними id)
      const { data: treeItems } = await studentGroupApi.searchStudentGroupTree({ scheduleId });

      const streams: Stream[] = [];
      const groups: Group[] = [];

      // Шаг 2: для каждого корневого элемента запрашиваем /view чтобы узнать тип
      await Promise.all(
        treeItems.map(async (treeItem) => {
          const { data: rootDto } = await studentGroupApi.getStudentGroup({
            studentGroupId: treeItem.id,
          });

          if (rootDto.studentGroupType === 'Thread') {
            // Это поток — его дети (из treeItem.children) суть группы
            streams.push({
              id: rootDto.id,
              name: rootDto.name ?? treeItem.name,
              semesterNumber: rootDto.semesterNumber,
              groupIds: treeItem.children,
              disciplineIds: [],
            });

            // Шаг 3: загружаем каждую дочернюю группу
            await Promise.all(
              treeItem.children.map(async (groupId) => {
                const { data: groupDto } = await studentGroupApi.getStudentGroup({
                  studentGroupId: groupId,
                });
                groups.push({
                  id: groupDto.id,
                  name: groupDto.name ?? groupId,
                  streamId: rootDto.id,
                  subgroups: (groupDto.children ?? []).map((sg) => ({
                    id: sg.id,
                    name: sg.name ?? sg.id,
                  })),
                  studentCount: 0,
                  disciplineIds: [],
                });
              }),
            );
          } else if (rootDto.studentGroupType === 'Group') {
            // Группа верхнего уровня (без потока)
            groups.push({
              id: rootDto.id,
              name: rootDto.name ?? treeItem.name,
              streamId: '',
              subgroups: (rootDto.children ?? []).map((sg) => ({
                id: sg.id,
                name: sg.name ?? sg.id,
              })),
              studentCount: 0,
              disciplineIds: [],
            });
          }
        }),
      );

      return { groups, streams };
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message);
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
