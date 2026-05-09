import apiClient from './client';
import type { CampusRegistryItemDto, CampusSaveDto } from './types';

export const campusApi = {
  /** Получить краткий список учебных корпусов */
  searchCampuses: () =>
    apiClient.get<CampusRegistryItemDto[]>('/campus/search-short'),

  /** Создать / обновить учебный корпус */
  saveCampus: (data: CampusSaveDto) =>
    apiClient.post<void>('/campus/save', data),
};
