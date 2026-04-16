import apiClient from './client';
import type {
  RegistryDto,
  SaveStudentGroupDto,
  SearchParametersDto,
  StudentGroupRegistryItemDto,
  StudentGroupViewDto,
} from './types';

export const studentGroupApi = {
  /** Получить список академических групп */
  searchStudentGroups: (body: { searchParameters: SearchParametersDto }) =>
    apiClient.post<RegistryDto<StudentGroupRegistryItemDto>>('/student-group/search', body),

  /** Получить данные академической группы */
  getStudentGroup: (params: { studentGroupId: string }) =>
    apiClient.get<StudentGroupViewDto>('/student-group/view', { params }),

  /** Создать / обновить академическую группу */
  saveStudentGroup: (data: SaveStudentGroupDto) =>
    apiClient.post<void>('/student-group/save', data),

  /** Удалить академическую группу / поток */
  deleteStudentGroup: (params: { studentGroupId: string }) =>
    apiClient.delete<void>('/student-group/delete', { params }),
};
