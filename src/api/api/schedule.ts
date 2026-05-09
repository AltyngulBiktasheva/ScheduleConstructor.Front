import apiClient from './client';
import type { RegistryDto, ScheduleSaveDto, ScheduleDto, ScheduleRegistryItemDto, SearchParametersDto } from './types';

export const scheduleApi = {
  /** Получить список проектов расписаний (краткий) */
  getSchedules: () =>
    apiClient.get<ScheduleDto[]>('/schedule'),

  /** Поиск проектов расписаний с полными данными */
  searchSchedules: (body: { searchParameters: SearchParametersDto } = { searchParameters: { page: 1, itemsPerPage: 100 } }) =>
    apiClient.post<RegistryDto<ScheduleRegistryItemDto>>('/schedule/search', body),

  /** Создать / обновить проект расписания */
  saveSchedule: (data: ScheduleSaveDto) =>
    apiClient.post<void>('/schedule/save', data),

  /** Удалить проект расписания */
  deleteSchedule: (scheduleId: string) =>
    apiClient.delete<void>('/schedule/delete', { params: { scheduleId } }),
};
