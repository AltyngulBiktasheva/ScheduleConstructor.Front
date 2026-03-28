import apiClient from './client';
import type { SaveScheduleDto, ScheduleDto } from './types';

export const scheduleApi = {
  /** Получить список проектов расписаний */
  searchSchedules: () =>
    apiClient.get<ScheduleDto[]>('/Schedule/SearchSchedules'),

  /** Создать новый проект расписания */
  saveSchedule: (data: SaveScheduleDto) =>
    apiClient.post<string>('/Schedule/SaveSchedule', data),
};
