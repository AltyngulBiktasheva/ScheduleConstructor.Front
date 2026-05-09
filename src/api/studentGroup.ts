import apiClient from './client';
import type { StudentGroupSaveDto, StudentGroupViewDto } from './types';

export const studentGroupApi = {
  /** Получить данные академической группы */
  getStudentGroup: (params: { studentGroupId: string; scheduleId: string }) =>
    apiClient.get<StudentGroupViewDto>('/StudentGroup/GetStudentGroup', { params }),

  /** Создать студенческую группу */
  saveStudentGroup: (data: StudentGroupSaveDto) =>
    apiClient.post<string>('/StudentGroup/SaveStudentGroup', data),
};
