import apiClient from './client';
import type { DateInterval, LessonViewDto, LessonWeekConflictDto, SaveLessonRequestDto } from './types';

export const lessonApi = {
  /** Получить данные занятия */
  getLesson: (params: { lessonId: string; scheduleId: string }) =>
    apiClient.get<LessonViewDto>('/Lesson/GetLesson', { params }),

  /** Добавить / обновить занятие */
  saveLesson: (data: SaveLessonRequestDto) =>
    apiClient.post<string>('/Lesson/SaveLesson', data),

  /** Получить временные конфликты занятия по дням недели */
  getLessonWeekConflicts: (lessonId: string, dateInterval: DateInterval) =>
    apiClient.get<LessonWeekConflictDto[]>('/Lesson/GetLessonWeekConflicts', {
      params: { lessonId },
      data: dateInterval,
    }),
};
