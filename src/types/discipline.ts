import type { BuildingType } from '../constants/buildings';

export type RepeatType = 'every-week' | 'once' | 'every-two-weeks';

export interface Discipline {
    id: string;
    name: string;
    teacher?: string;
    building: BuildingType;
    buildingName?: string;
    audience?: string;
    timeStart?: string;
    timeEnd?: string;
    dayId?: string;
    repeat: RepeatType;
    comment?: string;
    isInGrid: boolean;
    slotId?: string;
}

export interface DisciplinePosition {
    disciplineId: string;
    slotId: string;
    offset?: number;
}