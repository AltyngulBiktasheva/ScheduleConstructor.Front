import type { BuildingType } from '../constants/buildings';

export type ClassroomType = 'standard' | 'computer' | 'laboratory' | 'amphitheater';
export type BoardType = 'chalk' | 'marker';

export const CLASSROOM_TYPE_LABELS: Record<ClassroomType, string> = {
  standard: 'Стандартная',
  computer: 'Компьютерная',
  laboratory: 'Лаборатория',
  amphitheater: 'Амфитеатр',
};

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  chalk: 'Меловая',
  marker: 'Маркерная',
};

export interface Classroom {
  id: string;
  name: string;
  building: BuildingType;
  buildingName?: string;
  type: ClassroomType;
  capacity: number;
  boardType: BoardType;
  hasProjector: boolean;
}