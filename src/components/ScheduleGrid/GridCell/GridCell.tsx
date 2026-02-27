import React, { type FC } from 'react';
import styles from './GridCell.module.scss';
import { DAYS } from '../../../constants/grid.constants';
import { CellState } from '../../../constants/cellState.constants';
import { type GridCellProps } from '../../../types/cell.types';
import { type CellPosition } from '../../../types/grid.types';

export const GridCell: FC<GridCellProps> = ({
                                                day,
                                                timeSlot,
                                                state = CellState.DEFAULT,
                                                onDrop,
                                                children
                                            }) => {
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy'; // Меняем на copy для новых элементов

        // Добавляем визуальный индикатор
        const target = e.currentTarget;
        target.classList.add(styles.dragOver);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.stopPropagation();

        // Убираем визуальный индикатор
        const target = e.currentTarget;
        target.classList.remove(styles.dragOver);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.stopPropagation();

        console.log('🎯 Drop on cell:', { day, timeSlot }); // Отладка

        // Убираем визуальный индикатор
        const target = e.currentTarget;
        target.classList.remove(styles.dragOver);

        try {
            console.log('📦 DataTransfer types:', e.dataTransfer.types);

            // Получаем данные из dataTransfer
            const dataStr = e.dataTransfer.getData('application/json');
            console.log('📦 Drop data:', dataStr); // Отладка

            if (!dataStr) {
                console.log('❌ No data in drop');
                const textData = e.dataTransfer.getData('text/plain');
                console.log('📦 Text data:', textData);
                return;
            }

            const data = JSON.parse(dataStr);
            console.log('✅ Parsed drop data:', data); // Отладка

            // Вызываем onDrop с данными и позицией
            onDrop(data, { day, timeSlot } as CellPosition);
        } catch (error) {
            console.error('Error parsing dropped data:', error);
        }
    };

    const getStateClass = (): string => {
        switch(state) {
            case CellState.SUCCESS:
                return styles.success;
            case CellState.WARNING:
                return styles.warning;
            case CellState.ERROR:
                return styles.error;
            default:
                return '';
        }
    };

    const renderContent = (): React.ReactElement => {
        const contentClass = `${styles.content} ${getStateClass()}`;

        const cellContent = (
            <div className={contentClass}>
                {children}
            </div>
        );

        if (state === CellState.WARNING || state === CellState.ERROR) {
            return (
                <div
                    className={styles.tooltipWrapper}
                    data-tooltip={`Состояние: ${state}`}
                >
                    {cellContent}
                </div>
            );
        }

        return cellContent;
    };

    return (
        <div
            className={styles.cell}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-day={day}
            data-time={timeSlot}
        >
            {renderContent()}
            <div
                className={styles.label}
            >
                {DAYS[day]} {timeSlot + 1}:00
            </div>
        </div>
    );
};