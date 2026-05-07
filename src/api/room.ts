import apiClient from './client';
import type { RoomTreeDto, RoomViewDto, RoomSaveDto } from './types';

export const roomApi = {
  /** Получить данные аудитории */
  getRoom: (params: { roomId: string }) =>
    apiClient.get<RoomViewDto>('/Room/GetRoom', { params }),

  /** Получить дерево аудиторий */
  getRoomTree: () =>
    apiClient.get<RoomTreeDto>('/Room/GetRoomTree'),

  /** Добавить аудиторию */
  saveRoom: (data: RoomSaveDto) =>
    apiClient.post<string>('/Room/SaveRoom', data),
};
