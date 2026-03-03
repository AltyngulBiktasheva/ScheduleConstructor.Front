import type { SlotColor } from '../constants/colors';

export interface SlotWarning {
    type: 'yellow' | 'red';
    message: string;
}

export interface GridSlot {
    id: string;
    timeSlotId: string;
    dayId: string;
    color: SlotColor;
    warning?: SlotWarning;
    disciplineId?: string;
}