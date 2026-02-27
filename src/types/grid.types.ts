export interface CellPosition {
    day: 0 | 1 | 2 | 3 | 4 | 5;          // индекс дня (0-5)
    timeSlot: 0 | 1 | 2 | 3 | 4 | 5 | 6; // индекс временного слота (0-6)
}

export interface DraggedData {
    id: number;
    startTime: number;
    endTime: number;
    day: number;
    type: 'event';
}

export interface DraggableItemData {
    id: number;
    day: number;
    startTime: number;
    endTime: number;
}