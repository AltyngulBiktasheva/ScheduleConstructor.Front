import apiClient from './client';
import type { RegistryDto, SaveScheduleDto, ScheduleDto, SearchParametersDto } from './types';

export const scheduleApi = {
  /** Получить список проектов расписаний */
  searchSchedules: (body: { searchParameters: SearchParametersDto } = { searchParameters: { page: 1, itemsPerPage: 100 } }) =>
    apiClient.post<RegistryDto<ScheduleDto>>('/schedule/search', body),

  /** Создать / обновить проект расписания */
  saveSchedule: (data: SaveScheduleDto) =>
    apiClient.post<void>('/schedule/save', data),
};
