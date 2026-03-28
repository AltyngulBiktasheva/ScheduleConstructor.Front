import apiClient from './client';
import type { AcademicDisciplineViewDto, SaveAcademicDisciplineDto } from './types';

export const academicDisciplineApi = {
  /** Получить данные академической дисциплины */
  getAcademicDiscipline: (params: {
    academicDisciplineId: string;
    scheduleId: string;
  }) =>
    apiClient.get<AcademicDisciplineViewDto>('/AcademicDiscipline/GetAcademicDiscipline', {
      params,
    }),

  /** Сохранить академическую дисциплину (создать или обновить) */
  saveAcademicDiscipline: (data: SaveAcademicDisciplineDto) =>
    apiClient.get<void>('/AcademicDiscipline/SaveAcademicDiscipline', {
      data,
    }),
};
