import apiClient from './client';
import type {
  AcademicDisciplineRegistryItemDto,
  AcademicDisciplineViewDto,
  RegistryDto,
  SaveAcademicDisciplineDto,
  SearchParametersDto,
} from './types';

export const academicDisciplineApi = {
  /** Получить список академических дисциплин */
  searchAcademicDisciplines: (body: { searchParameters: SearchParametersDto }) =>
    apiClient.post<RegistryDto<AcademicDisciplineRegistryItemDto>>('/academic-discipline/search', body),

  /** Получить данные академической дисциплины */
  getAcademicDiscipline: (params: { academicDisciplineId: string }) =>
    apiClient.get<AcademicDisciplineViewDto>('/academic-discipline/view', { params }),

  /** Сохранить академическую дисциплину (создать или обновить) */
  saveAcademicDiscipline: (data: SaveAcademicDisciplineDto) =>
    apiClient.post<void>('/academic-discipline/save', data),
};
