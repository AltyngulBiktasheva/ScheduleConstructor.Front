import apiClient from './client';
import type { TeacherPreferenceSaveDto, TeacherPreferencesViewDto } from './types';

// TeacherPreferencesViewDto — псевдоним для совместимости с компонентами
export const teacherPreferenceApi = {
  /** Получить пожелания преподавателя */
  getTeacherPreferences: (params: { teacherId: string; scheduleId: string }) =>
    apiClient.get<TeacherPreferencesViewDto>('/teacher-preference/view', { params }),

  /** Сохранить пожелания преподавателя */
  saveTeacherPreference: (data: TeacherPreferenceSaveDto) =>
    apiClient.post<void>('/teacher-preference/save', data),
};
