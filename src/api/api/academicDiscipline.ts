import apiClient from './client';
import type {
  AcademicDisciplineRegistryItemDto,
  AcademicDisciplineType,
  AcademicDisciplineViewDto,
  AcademicDisciplineWeekConflictDto,
  RegistryDto,
  AcademicDisciplineSaveDto,
  SearchParametersDto,
} from './types';

export const academicDisciplineApi = {
  /** Получить список академических дисциплин */
  searchAcademicDisciplines: (body: { scheduleId?: string; searchParameters: SearchParametersDto }) =>
    apiClient.post<RegistryDto<AcademicDisciplineRegistryItemDto>>('/academic-discipline/search', body),

  /** Получить данные академической дисциплины */
  getAcademicDiscipline: (params: { academicDisciplineId: string }) =>
    apiClient.get<AcademicDisciplineViewDto>('/academic-discipline/view', { params }),

  /** Сохранить академическую дисциплину (создать или обновить) */
  saveAcademicDiscipline: (data: AcademicDisciplineSaveDto) =>
    apiClient.post<void>('/academic-discipline/save', data),

  /** Получить конфликтные временные слоты дисциплины за неделю */
  getWeekConflicts: (params: { academicDisciplineId: string; academicDisciplineType: AcademicDisciplineType }) =>
    apiClient.get<AcademicDisciplineWeekConflictDto[]>('/academic-discipline/week-conflicts', { params }),

  /** Удалить академическую дисциплину */
  deleteAcademicDiscipline: (params: { academicDisciplineId: string }) =>
    apiClient.delete<void>('/academic-discipline/delete', { params }),
};
