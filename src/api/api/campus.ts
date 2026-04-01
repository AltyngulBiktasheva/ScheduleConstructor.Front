import apiClient from './client';
import type { CampusRegistryItemDto, RegistryDto, SaveCampusDto, SearchParametersDto } from './types';

export const campusApi = {
  /** Получить список учебных корпусов */
  searchCampuses: (body: { searchParameters: SearchParametersDto } = { searchParameters: { page: 1, itemsPerPage: 100 } }) =>
    apiClient.post<RegistryDto<CampusRegistryItemDto>>('/campus/search', body),

  /** Создать / обновить учебный корпус */
  saveCampus: (data: SaveCampusDto) =>
    apiClient.post<void>('/campus/save', data),
};
