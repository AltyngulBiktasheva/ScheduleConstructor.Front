import apiClient from './client';
import type { CampusDto, CampusSaveDto } from './types';

export const campusApi = {
  /** Получить список учебных корпусов */
  getCampuses: () =>
    apiClient.get<CampusDto[]>('/Campus/GetCampuses'),

  /** Создать новый учебный корпус */
  saveCampus: (data: CampusSaveDto) =>
    apiClient.post<string>('/Campus/SaveCampus', data),
};
