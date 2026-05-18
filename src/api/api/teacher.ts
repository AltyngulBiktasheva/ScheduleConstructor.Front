import apiClient from './client';
import type { RegistryDto, TeacherSaveDto, SearchParametersDto, TeacherRegistryItemDto, TeacherViewDto } from './types';

export interface TeacherShortDto {
  id: string;
  fullname: string;
  contacts?: string;
}

export const teacherApi = {
  /** Получить список преподавателей */
  searchTeachers: (body: { searchParameters: SearchParametersDto }) =>
    apiClient.post<RegistryDto<TeacherRegistryItemDto>>('/teacher/search', body),

  /** Получить краткий список преподавателей */
  searchTeachersShort: () =>
    apiClient.get<TeacherShortDto[]>('/teacher/search-short'),

  /** Получить данные преподавателя */
  getTeacher: (params: { teacherId: string }) =>
    apiClient.get<TeacherViewDto>('/teacher/view', { params }),

  /** Сохранить преподавателя */
  saveTeacher: (data: TeacherSaveDto) =>
    apiClient.post<void>('/teacher/save', data),

  /** Удалить преподавателя */
  deleteTeacher: (params: { teacherId: string }) =>
    apiClient.delete<void>('/teacher/delete', { params }),
};
