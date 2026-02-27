import { type CellStateType } from './cell.types';

export interface Discipline {
    id: string | number;
    name: string;
    code?: string;
    color?: string;
    hours: number; // количество часов (определяет высоту в сетке)
    icon?: string;
    state?: CellStateType; // состояние для окраски
    description?: string;
}

export interface PlacedDiscipline extends Discipline {
    day: number;        // день недели (индекс)
    startTime: number;  // время начала (индекс временного слота)
    endTime: number;    // время окончания (startTime + hours)
}