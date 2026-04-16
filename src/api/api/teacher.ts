import apiClient from './client';
import type { RegistryDto, SaveTeacherDto, SearchParametersDto, TeacherRegistryItemDto, TeacherViewDto } from './types';

export const teacherApi = {
  /** Получить список преподавателей */
  searchTeachers: (body: { searchParameters: SearchParametersDto }) =>
    apiClient.post<RegistryDto<TeacherRegistryItemDto>>('/teacher/search', body),

  /** Получить данные преподавателя */
  getTeacher: (params: { teacherId: string }) =>
    apiClient.get<TeacherViewDto>('/teacher/view', { params }),

  /** Сохранить преподавателя */
  saveTeacher: (data: SaveTeacherDto) =>
    apiClient.post<void>('/teacher/save', data),

  /** Удалить преподавателя */
  deleteTeacher: (params: { teacherId: string }) =>
    apiClient.delete<void>('/teacher/delete', { params }),
};
