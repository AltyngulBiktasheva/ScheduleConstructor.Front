import apiClient from './client';
import type {
  RegistryDto,
  SaveStudentGroupDto,
  SearchParametersDto,
  StudentGroupRegistryItemDto,
  StudentGroupTreeItemDto,
  StudentGroupViewDto,
} from './types';

export const studentGroupApi = {
  /** Получить дерево академических групп по расписанию (для конструктора) */
  searchStudentGroupTree: (params: { scheduleId: string }) =>
    apiClient.get<StudentGroupTreeItemDto[]>('/student-group/search-tree', { params }),

  /** Получить плоский список академических групп и потоков (для реестра) */
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
