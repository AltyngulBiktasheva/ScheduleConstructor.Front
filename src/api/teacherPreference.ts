import apiClient from './client';
import type { TeacherPreferenceSaveDto, TeacherPreferencesViewDto } from './types';

export const teacherPreferenceApi = {
  /** Получить пожелания преподавателя */
  getTeacherPreferences: (params: { teacherId: string; scheduleId: string }) =>
    apiClient.get<TeacherPreferencesViewDto>('/TeacherPreference/GetTeacherPreferences', {
      params,
    }),

  /** Сохранить пожелания преподавателя */
  saveTeacherPreference: (data: TeacherPreferenceSaveDto) =>
    apiClient.post<void>('/TeacherPreference/SaveTeacherPreference', data),
};
