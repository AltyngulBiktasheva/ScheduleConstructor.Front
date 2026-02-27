import React, { type FC, useRef } from 'react';
import styles from './DraggableItem.module.scss';
import { BLOCK_HEIGHT } from '../../../constants/grid.constants';
import { type DraggableItemProps } from '../../../types/draggableItem.types.ts';

export const DraggableItem: FC<DraggableItemProps> = ({
    item,
    onDragStart,
    onDragEnd,
    onDrag
}) => {
    const dragStartY = useRef<number>(0);
    const initialStartTime = useRef<number>(item.startTime);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
        // Запоминаем начальную позицию мыши
        dragStartY.current = e.clientY;
        initialStartTime.current = item.startTime;

        // Сохраняем данные элемента
        e.dataTransfer.setData('application/json', JSON.stringify({
            ...item,
            type: 'event',
            initialStartTime: item.startTime,
            initialDay: item.day
        }));
        e.dataTransfer.effectAllowed = 'move';

        // Важно для корректного отображения при перетаскивании
        e.dataTransfer.setDragImage(new Image(), 0, 0);

        onDragStart?.(item);
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>): void => {
        if (e.clientY === 0) return; // Игнорируем нулевые события

        // Рассчитываем смещение по вертикали
        const deltaY = e.clientY - dragStartY.current;
        const timeDelta = deltaY / BLOCK_HEIGHT;

        // Обновляем позицию элемента в реальном времени
        onDrag?.({
            ...item,
            startTime: initialStartTime.current + timeDelta
        }, e.clientY);
    };

    const handleDragEnd = (): void => {
        onDragEnd?.();
    };

    const getItemHeight = (): number => {
        const duration = item.endTime - item.startTime;
        return Math.max(duration * BLOCK_HEIGHT, BLOCK_HEIGHT / 2); // Минимальная высота
    };

    const getTopOffset = (): number => {
        return item.startTime * BLOCK_HEIGHT;
    };

    const itemStyle: React.CSSProperties = {
        top: getTopOffset(),
        height: getItemHeight(),
        position: 'absolute',
        width: '100%'
    };

    return (
        <div
            className={styles.item}
            style={itemStyle}
            draggable={true}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
        >
            <div className={styles.content}>
                <div className={styles.title}>{item.title || `Событие ${item.id}`}</div>
                <div className={styles.time}>
                    {Math.floor(item.startTime)}:00 - {Math.floor(item.endTime)}:00
                </div>
            </div>
        </div>
    );
};