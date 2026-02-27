import React, { type FC } from 'react';
import styles from './DisciplinesPanel.module.scss';
import { type Discipline } from '../../types/discipline.types';
import { CellState } from '../../constants/cellState.constants';

interface DisciplineCardProps {
    discipline: Discipline;
    onDragStart: (discipline: Discipline) => void;
}

export const DisciplineCard: FC<DisciplineCardProps> = ({ discipline, onDragStart }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        // Создаем данные для передачи
        const dragData = {
            id: discipline.id,
            name: discipline.name,
            code: discipline.code,
            hours: discipline.hours,
            color: discipline.color,
            state: discipline.state,
            type: 'discipline-from-panel', // Специальный тип для новых дисциплин
            source: 'panel' // Указываем источник
        };

        // Сохраняем данные в dataTransfer
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'copy'; // copy, потому что создаем новый элемент

        // Создаем кастомный превью для перетаскивания
        const dragPreview = document.createElement('div');
        dragPreview.className = styles.dragPreview;
        dragPreview.innerHTML = `
      <div style="
        background-color: ${discipline.color || '#4a90e2'};
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">
        ${discipline.name} (${discipline.hours} ч.)
      </div>
    `;
        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 10, 10);

        // Удаляем превью после установки
        setTimeout(() => {
            document.body.removeChild(dragPreview);
        }, 0);

        onDragStart(discipline);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        // Сбрасываем эффект перетаскивания
        e.dataTransfer.clearData();
    };

    const getStateClass = (): string => {
        switch(discipline.state) {
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

    return (
        <div
            className={`${styles.disciplineCard} ${getStateClass()}`}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{
                '--discipline-color': discipline.color || '#4a90e2'
            } as React.CSSProperties}
        >
            <div className={styles.cardHeader}>
                <span className={styles.code}>{discipline.code}</span>
                <span className={styles.hours}>{discipline.hours} ч.</span>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.name}>{discipline.name}</div>
                {discipline.description && (
                    <div className={styles.description}>{discipline.description}</div>
                )}
            </div>
        </div>
    );
};