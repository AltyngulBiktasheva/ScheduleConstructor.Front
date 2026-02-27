import React, { type FC, useState, useCallback } from 'react';
import styles from './ScheduleGrid.module.scss';
import { GridCell } from './GridCell/GridCell';
import { DraggableItem } from './DraggableItem/DraggableItem';
import { DAYS, TIME_SLOTS, BLOCK_WIDTH, BLOCK_HEIGHT } from '../../constants/grid.constants';
import { CellState } from '../../constants/cellState.constants';
import { type CellStateMap } from '../../types/cell.types';
import type { Discipline, PlacedDiscipline } from '../../types/discipline.types';

interface ScheduleGridProps {
    placedDisciplines?: PlacedDiscipline[];
    onDisciplinePlaced?: (discipline: PlacedDiscipline) => void;
    onDisciplineMoved?: (discipline: PlacedDiscipline) => void;
    onDisciplineRemoved?: (disciplineId: string | number) => void;
}

export const ScheduleGrid: FC<ScheduleGridProps> = ({
                                                        placedDisciplines: externalPlacedDisciplines,
                                                        onDisciplinePlaced,
                                                        onDisciplineMoved,
                                                        onDisciplineRemoved
                                                    }) => {
    const [internalPlacedDisciplines, setInternalPlacedDisciplines] = useState<PlacedDiscipline[]>([]);
    const placedDisciplines = externalPlacedDisciplines ?? internalPlacedDisciplines;

    const [draggedItem, setDraggedItem] = useState<Discipline | PlacedDiscipline | null>(null);
    const [dragPreview, setDragPreview] = useState<{ day: number; startTime: number; isValid: boolean } | null>(null);

    const [cellStates] = useState<CellStateMap>(() => {
        const states: CellStateMap = {};
        for (let day = 0; day < 6; day++) {
            for (let time = 0; time < TIME_SLOTS; time++) {
                const random = Math.random();
                if (random < 0.3) {
                    states[`${day}-${time}`] = CellState.SUCCESS;
                } else if (random < 0.5) {
                    states[`${day}-${time}`] = CellState.WARNING;
                } else if (random < 0.6) {
                    states[`${day}-${time}`] = CellState.ERROR;
                }
            }
        }
        return states;
    });

    // Проверка, можно ли разместить дисциплину
    const canPlaceDiscipline = useCallback((
        discipline: Discipline | PlacedDiscipline,
        day: number,
        startTime: number
    ): boolean => {
        const hours = 'hours' in discipline ? discipline.hours : (discipline.endTime - discipline.startTime);
        const endTime = startTime + hours;

        // Проверка границ сетки
        if (startTime < 0 || endTime > TIME_SLOTS) return false;

        // Проверка пересечений (исключаем саму себя при перемещении)
        return !placedDisciplines.some(placed => {
            // При перемещении не проверяем пересечение с самим собой
            if ('id' in discipline && placed.id === discipline.id) return false;

            return placed.day === day &&
                ((startTime >= placed.startTime && startTime < placed.endTime) ||
                    (endTime > placed.startTime && endTime <= placed.endTime) ||
                    (startTime <= placed.startTime && endTime >= placed.endTime));
        });
    }, [placedDisciplines]);

    // Обработка перетаскивания над сеткой
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        console.log('HANDLE DRAG OVER')

        // Получаем позицию мыши относительно сетки
        const gridRect = e.currentTarget.getBoundingClientRect();
        const relativeX = e.clientX - gridRect.left;
        const relativeY = e.clientY - gridRect.top;

        // Определяем день и время
        const day = Math.floor(relativeX / BLOCK_WIDTH);
        const startTime = Math.floor(relativeY / BLOCK_HEIGHT);

        // Проверяем, есть ли данные перетаскивания
        try {
            const dataStr = e.dataTransfer.getData('application/json');
            if (dataStr) {
                const data = JSON.parse(dataStr);

                // Проверяем валидность позиции
                const isValid = canPlaceDiscipline(data, day, startTime);

                setDragPreview({ day, startTime, isValid });
            }
        } catch (error) {
            // Игнорируем ошибки парсинга
        }
    }, [canPlaceDiscipline]);

    // Обработка Drop события
    const handleDrop = useCallback((draggedData: any, targetCell: { day: number; timeSlot: number }) => {
        console.log('Drop received:', draggedData, targetCell);

        // Проверяем, что это дисциплина из панели
        if (draggedData.source === 'panel' || draggedData.type === 'discipline-from-panel') {
            const discipline = draggedData as Discipline;
            const endTime = targetCell.timeSlot + discipline.hours;

            // Проверяем возможность размещения
            if (!canPlaceDiscipline(discipline, targetCell.day, targetCell.timeSlot)) {
                alert('Нельзя разместить дисциплину здесь: пересечение с другой дисциплиной или выход за границы');
                return;
            }

            const newPlacedDiscipline: PlacedDiscipline = {
                id: `placed-${discipline.id}-${Date.now()}`, // Уникальный ID для размещенной дисциплины
                name: discipline.name,
                code: discipline.code,
                hours: discipline.hours,
                color: discipline.color,
                state: discipline.state,
                description: discipline.description,
                day: targetCell.day,
                startTime: targetCell.timeSlot,
                endTime: endTime
            };

            console.log('Placing new discipline:', newPlacedDiscipline);

            // Обновляем состояние
            if (externalPlacedDisciplines) {
                onDisciplinePlaced?.(newPlacedDiscipline);
            } else {
                setInternalPlacedDisciplines(prev => [...prev, newPlacedDiscipline]);
            }
        }
        // Если это перемещение существующей дисциплины
        else if (draggedData.type === 'event' || draggedData.type === 'placed-discipline') {
            const existingDiscipline = draggedData as PlacedDiscipline;
            const duration = existingDiscipline.endTime - existingDiscipline.startTime;
            const endTime = targetCell.timeSlot + duration;

            // Проверяем возможность размещения
            const canMove = canPlaceDiscipline(existingDiscipline, targetCell.day, targetCell.timeSlot);

            if (!canMove || endTime > TIME_SLOTS) {
                alert('Нельзя переместить дисциплину сюда');
                return;
            }

            const updatedDiscipline: PlacedDiscipline = {
                ...existingDiscipline,
                day: targetCell.day,
                startTime: targetCell.timeSlot,
                endTime: endTime
            };

            console.log('Moving discipline:', updatedDiscipline);

            // Обновляем состояние
            if (externalPlacedDisciplines) {
                onDisciplineMoved?.(updatedDiscipline);
            } else {
                setInternalPlacedDisciplines(prev =>
                    prev.map(d => d.id === existingDiscipline.id ? updatedDiscipline : d)
                );
            }
        }

        setDragPreview(null);
        setDraggedItem(null);
    }, [placedDisciplines, canPlaceDiscipline, externalPlacedDisciplines, onDisciplinePlaced, onDisciplineMoved]);

    // Обработка двойного клика для удаления
    const handleDoubleClick = useCallback((disciplineId: string | number) => {
        if (window.confirm('Удалить дисциплину из расписания?')) {
            if (externalPlacedDisciplines) {
                onDisciplineRemoved?.(disciplineId);
            } else {
                setInternalPlacedDisciplines(prev =>
                    prev.filter(d => d.id !== disciplineId)
                );
            }
        }
    }, [externalPlacedDisciplines, onDisciplineRemoved]);

    // Рендерим сетку
    const renderGrid = (): React.ReactElement[] => {
        const cells: React.ReactElement[] = [];
        for (let timeSlot = 0; timeSlot < TIME_SLOTS; timeSlot++) {
            for (let day = 0; day < 6; day++) {
                const cellKey = `${day}-${timeSlot}`;

                // Находим дисциплину в этой ячейке
                const disciplineInCell = placedDisciplines.find(
                    d => d.day === day &&
                        timeSlot >= d.startTime &&
                        timeSlot < d.endTime
                );

                cells.push(
                    <GridCell
                        key={cellKey}
                        day={day}
                        timeSlot={timeSlot}
                        state={cellStates[cellKey]}
                        onDrop={handleDrop}
                    >
                        {disciplineInCell && timeSlot === disciplineInCell.startTime && (
                            <div
                                className={styles.disciplineLabel}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    handleDoubleClick(disciplineInCell.id);
                                }}
                                style={{ backgroundColor: disciplineInCell.color || '#4a90e2' }}
                                title="Двойной клик для удаления"
                            >
                                {disciplineInCell.name}
                                {disciplineInCell.hours > 1 && ` (${disciplineInCell.hours} ч.)`}
                            </div>
                        )}
                    </GridCell>
                );
            }
        }
        return cells;
    };

    // Рендерим размещенные дисциплины как перетаскиваемые элементы
    const renderPlacedDisciplines = (): React.ReactElement[] => {
        return placedDisciplines.map(discipline => (
            <div
                key={discipline.id}
                style={{
                    gridColumn: discipline.day + 1,
                    gridRow: 1,
                    position: 'relative',
                    pointerEvents: 'none'
                }}
            >
                <DraggableItem
                    item={discipline}
                    onDragStart={(item) => {
                        setDraggedItem(item);
                        // Добавляем тип для перемещения
                        const data = {
                            ...item,
                            type: 'placed-discipline'
                        };
                        // Сохраняем в dataTransfer при старте
                        const dragEvent = window.event as DragEvent;
                        dragEvent.dataTransfer?.setData('application/json', JSON.stringify(data));
                    }}
                    onDragEnd={() => {
                        setDragPreview(null);
                        setDraggedItem(null);
                    }}
                />
            </div>
        ));
    };

    // Рендерим предпросмотр перетаскивания
    const renderDragPreview = (): React.ReactElement | null => {
        if (!dragPreview) return null;

        const { day, startTime, isValid } = dragPreview;

        return (
            <div
                className={`${styles.dragPreview} ${isValid ? styles.valid : styles.invalid}`}
                style={{
                    gridColumn: day + 1,
                    gridRow: startTime + 1,
                    width: BLOCK_WIDTH,
                    height: BLOCK_HEIGHT,
                }}
            >
                <div className={styles.previewContent}>
                    {isValid ? '✓ Можно разместить' : '✗ Нельзя разместить'}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.gridContainer}>
            <div className={styles.header}>
                <div className={styles.cornerPlaceholder}></div>
                {DAYS.map(day => (
                    <div
                        key={day}
                        className={styles.dayHeader}
                        style={{ width: BLOCK_WIDTH }}
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className={styles.wrapper}>
                <div className={styles.timeLabels}>
                    {Array.from({ length: TIME_SLOTS }, (_, i) => (
                        <div key={i} className={styles.timeLabel}>
                            {i}:00 - {i + 1}:00
                        </div>
                    ))}
                </div>

                <div
                    className={styles.grid}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setDragPreview(null)}
                >
                    {renderGrid()}

                    <div className={styles.draggableLayer}>
                        {renderPlacedDisciplines()}
                    </div>

                    {renderDragPreview()}
                </div>
            </div>
        </div>
    );
};