import apiClient from './client';
import type { ScheduleSaveDto, ScheduleDto } from './types';

export const scheduleApi = {
  /** Получить список проектов расписаний */
  searchSchedules: () =>
    apiClient.get<ScheduleDto[]>('/Schedule/SearchSchedules'),

  /** Создать новый проект расписания */
  saveSchedule: (data: ScheduleSaveDto) =>
    apiClient.post<string>('/Schedule/SaveSchedule', data),
};
