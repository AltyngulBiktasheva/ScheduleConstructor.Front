import apiClient from './client';
import type { RegistryDto, RoomRegistryItemDto, RoomTreeDto, RoomViewDto, RoomSaveDto, SearchRoomsDto } from './types';

export const roomApi = {
  /** Получить данные аудитории */
  getRoom: (params: { roomId: string }) =>
    apiClient.get<RoomViewDto>('/room/view', { params }),

  /** Поиск аудиторий с полными данными (тип, вместимость, доска, проектор) */
  searchRooms: (body: SearchRoomsDto) =>
    apiClient.post<RegistryDto<RoomRegistryItemDto>>('/room/search', body),

  /** Получить дерево аудиторий (используется в пожеланиях преподавателей) */
  getRoomTree: () =>
    apiClient.get<RoomTreeDto[]>('/room/search-tree'),

  /** Добавить / обновить аудиторию */
  saveRoom: (data: RoomSaveDto) =>
    apiClient.post<void>('/room/save', data),

  /** Удалить аудиторию */
  deleteRoom: (params: { roomId: string }) =>
    apiClient.delete<void>('/room/delete', { params }),
};
