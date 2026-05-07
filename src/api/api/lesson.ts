import apiClient from './client';
import type {
  LessonRegistryItemDto,
  LessonViewDto,
  LessonWeekConflictDto,
  LessonWeekItemDto,
  RegistryDto,
  LessonSaveDto,
  SearchParametersDto,
} from './types';

export const lessonApi = {
  /** Получить список занятий */
  searchLessons: (body: { searchParameters: SearchParametersDto }) =>
    apiClient.post<RegistryDto<LessonRegistryItemDto>>('/lesson/search', body),

  /** Получить занятия за неделю для сетки */
  searchWeekLessons: (params: { scheduleId: string; dateFrom: string; dateTo: string }) =>
    apiClient.get<LessonWeekItemDto[]>('/lesson/search-week', { params }),

  /** Получить данные занятия */
  getLesson: (params: { lessonId: string }) =>
    apiClient.get<LessonViewDto>('/lesson/view', { params }),

  /** Добавить / обновить занятие */
  saveLesson: (data: LessonSaveDto) =>
    apiClient.post<void>('/lesson/save', data),

  /** Удалить занятие из расписания */
  deleteLesson: (params: { scheduleId: string; lessonId: string }) =>
    apiClient.delete<void>('/lesson/delete', { params }),

  /** Получить временные конфликты занятия по дням недели */
  getLessonWeekConflicts: (params: { lessonId: string; dateFrom: string; dateTo: string }) =>
    apiClient.get<LessonWeekConflictDto[]>('/lesson/week-conflicts', { params }),
};
