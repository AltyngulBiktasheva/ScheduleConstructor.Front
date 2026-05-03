export type ClassroomType = 'standard' | 'computer' | 'laboratory' | 'amphitheater';
export type BoardType = 'chalk' | 'marker' | 'both';

export const CLASSROOM_TYPE_LABELS: Record<ClassroomType, string> = {
  standard: 'Стандартная',
  computer: 'Компьютерная',
  laboratory: 'Лаборатория',
  amphitheater: 'Амфитеатр',
};

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  chalk: 'Только меловая',
  marker: 'Только маркерная',
  both: 'Оба вида доски',
};

export interface Classroom {
  id: string;
  name: string;
  building: string;      // отображаемое имя корпуса (или BuildingType для старых данных)
  buildingName?: string;
  campusId?: string;     // UUID кампуса для API (обязателен при сохранении)
  type: ClassroomType;
  capacity: number;
  boardType: BoardType | null;   // null = не указано
  hasProjector: boolean | null;  // null = не указано
}