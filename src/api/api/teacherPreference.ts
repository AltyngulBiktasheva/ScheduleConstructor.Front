import apiClient from './client';
import type { SaveTeacherPreferenceDto, TeacherPreferencesViewDto } from './types';

export const teacherPreferenceApi = {
  /** Получить пожелания преподавателя */
  getTeacherPreferences: (params: { teacherId: string; scheduleId: string }) =>
    apiClient.get<TeacherPreferencesViewDto>('/teacher-preference/view', { params }),

  /** Сохранить пожелания преподавателя */
  saveTeacherPreference: (data: SaveTeacherPreferenceDto) =>
    apiClient.post<void>('/teacher-preference/save', data),
};
