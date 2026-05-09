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
import type { StudentGroupSaveDto } from '../../api';
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
            groupIds: dto.children?.map((c) => c.id) ?? [],
            disciplineIds: [],
          });
        } else if (dto.studentGroupType === 'Group') {
          groups.push({
            id: dto.id,
            name: dto.name,
            streamIds: dto.parents?.map((p) => p.id) ?? [],
            subgroups: dto.children?.map((c) => ({ id: c.id, name: c.name ?? '' })) ?? [],
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
 * Загружает иерархию групп через /student-group/search-tree (для конструктора).
 * Возвращает потоки с заполненными groupIds и группы с заполненными subgroups.
 * Перезаписывает тот же срез состояния, что и fetchGroupsAll.
 */
export const fetchGroupsTree = createAsyncThunk(
  'groupsList/fetchTree',
  async (scheduleId: string, { rejectWithValue }) => {
    try {
      const { data: treeItems } = await studentGroupApi.searchStudentGroupTree({ scheduleId });

      const streams: Stream[] = [];
      const groups: Group[] = [];

      // Для каждого корневого элемента вызываем /view только чтобы узнать тип (Thread или Group).
      // Данные групп и подгрупп читаем прямо из вложенного дерева — без дополнительных запросов.
      await Promise.all(
        treeItems.map(async (treeItem) => {
          const { data: rootDto } = await studentGroupApi.getStudentGroup({
            studentGroupId: treeItem.id,
          });

          if (rootDto.studentGroupType === 'Thread') {
            streams.push({
              id: treeItem.id,
              name: treeItem.name,
              semesterNumber: rootDto.semesterNumber,
              groupIds: treeItem.children.map((c) => c.id),
              disciplineIds: [],
            });

            // Группы и подгруппы берём из дерева — ID уже строки, лишних запросов нет
            for (const groupNode of treeItem.children) {
              groups.push({
                id: groupNode.id,
                name: groupNode.name,
                streamIds: [treeItem.id],
                subgroups: groupNode.children.map((sg) => ({
                  id: sg.id,
                  name: sg.name,
                })),
                studentCount: 0,
                disciplineIds: [],
              });
            }
          } else if (rootDto.studentGroupType === 'Group') {
            groups.push({
              id: treeItem.id,
              name: treeItem.name,
              streamIds: [],
              subgroups: treeItem.children.map((sg) => ({
                id: sg.id,
                name: sg.name,
              })),
              studentCount: 0,
              disciplineIds: [],
            });
          }
        }),
      );

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
    { entity, dto, isNew }: { entity: Group | Stream; dto: StudentGroupSaveDto; isNew: boolean },
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
      // fetchGroupsAll — плоский /search (реестр)
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
      // fetchGroupsTree — иерархический /search-tree (конструктор)
      .addCase(fetchGroupsTree.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupsTree.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload.groups;
        state.streams = action.payload.streams;
      })
      .addCase(fetchGroupsTree.rejected, (state, action) => {
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
