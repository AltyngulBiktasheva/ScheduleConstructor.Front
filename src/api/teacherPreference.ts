import apiClient from './client';
import type { SaveTeacherPreferenceDto, TeacherPreferencesViewDto } from './types';

export const teacherPreferenceApi = {
  /** Получить пожелания преподавателя */
  getTeacherPreferences: (params: { teacherId: string; scheduleId: string }) =>
    apiClient.get<TeacherPreferencesViewDto>('/TeacherPreference/GetTeacherPreferences', {
      params,
    }),

  /** Сохранить пожелания преподавателя */
  saveTeacherPreference: (data: SaveTeacherPreferenceDto) =>
    apiClient.post<void>('/TeacherPreference/SaveTeacherPreference', data),
};
