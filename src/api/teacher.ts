import apiClient from './client';
import type { TeacherSaveDto, TeacherViewDto } from './types';

export const teacherApi = {
  /** Получить данные преподавателя */
  getTeacher: (params: { teacherId: string }) =>
    apiClient.get<TeacherViewDto>('/Teacher/GetTeacher', { params }),

  /** Сохранить преподавателя */
  saveTeacher: (data: TeacherSaveDto) =>
    apiClient.post<string>('/Teacher/SaveTeacher', data),
};
