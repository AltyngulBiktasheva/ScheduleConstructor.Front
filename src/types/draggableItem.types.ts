export interface DraggableItemData {
    id: number | string;
    day: number;
    startTime: number;
    endTime: number;
    title?: string;
}

export interface DraggableItemProps {
    item: DraggableItemData;
    onDragStart?: (item: DraggableItemData) => void;
    onDragEnd?: () => void;
    onDrag?: (item: DraggableItemData, clientY: number) => void;
}