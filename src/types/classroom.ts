import type { BuildingType } from '../constants/buildings';

export type ClassroomType = 'standard' | 'computer' | 'laboratory' | 'amphitheater';

export const CLASSROOM_TYPE_LABELS: Record<ClassroomType, string> = {
  standard: 'Стандартная',
  computer: 'Компьютерная',
  laboratory: 'Лаборатория',
  amphitheater: 'Амфитеатр',
};

export interface Classroom {
  id: string;
  name: string;
  building: BuildingType;
  buildingName?: string;
  type: ClassroomType;
  capacity: number;
}
