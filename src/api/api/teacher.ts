import apiClient from './client';
import type { SaveTeacherDto, TeacherViewDto } from './types';

export const teacherApi = {
  /** Получить данные преподавателя */
  getTeacher: (params: { teacherId: string }) =>
    apiClient.get<TeacherViewDto>('/Teacher/GetTeacher', { params }),

  /** Сохранить преподавателя */
  saveTeacher: (data: SaveTeacherDto) =>
    apiClient.post<string>('/Teacher/SaveTeacher', data),
};
