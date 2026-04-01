import apiClient from './client';
import type {
  LessonRegistryItemDto,
  LessonViewDto,
  LessonWeekConflictDto,
  RegistryDto,
  SaveLessonRequestDto,
  SearchParametersDto,
} from './types';

export const lessonApi = {
  /** Получить список занятий */
  searchLessons: (body: { searchParameters: SearchParametersDto }) =>
    apiClient.post<RegistryDto<LessonRegistryItemDto>>('/lesson/search', body),

  /** Получить данные занятия */
  getLesson: (params: { lessonId: string }) =>
    apiClient.get<LessonViewDto>('/lesson/view', { params }),

  /** Добавить / обновить занятие */
  saveLesson: (data: SaveLessonRequestDto) =>
    apiClient.post<void>('/lesson/save', data),

  /** Получить временные конфликты занятия по дням недели */
  getLessonWeekConflicts: (params: { lessonId: string; dateFrom: string; dateTo: string }) =>
    apiClient.get<LessonWeekConflictDto[]>('/lesson/week-conflicts', { params }),
};
