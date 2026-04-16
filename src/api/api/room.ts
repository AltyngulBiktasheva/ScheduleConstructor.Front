import apiClient from './client';
import type { RoomTreeDto, RoomViewDto, SaveRoomDto } from './types';

export const roomApi = {
  /** Получить данные аудитории */
  getRoom: (params: { roomId: string }) =>
    apiClient.get<RoomViewDto>('/room/view', { params }),

  /** Получить дерево аудиторий (сгруппированы по кампусу) */
  getRoomTree: () =>
    apiClient.get<RoomTreeDto[]>('/room/search-tree'),

  /** Добавить / обновить аудиторию */
  saveRoom: (data: SaveRoomDto) =>
    apiClient.post<void>('/room/save', data),

  /** Удалить аудиторию */
  deleteRoom: (params: { roomId: string }) =>
    apiClient.delete<void>('/room/delete', { params }),
};
