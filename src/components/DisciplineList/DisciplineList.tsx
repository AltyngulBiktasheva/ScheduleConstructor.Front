import React from 'react';
import type { Discipline } from '../../types';
import { DisciplineCard } from '../DisciplineCard/DisciplineCard';
import styles from './Styles.module.scss';

interface Props {
    disciplines: Discipline[];
    onReturn: (disciplineId: string) => void;
    onDisciplineClick: (discipline: Discipline) => void;
}

export const DisciplineList: React.FC<Props> = ({
                                                    disciplines,
                                                    onReturn,
                                                    onDisciplineClick
                                                }) => {
    const handleDragStart = (e: React.DragEvent, discipline: Discipline) => {
        e.dataTransfer.setData('disciplineId', discipline.id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const disciplineId = e.dataTransfer.getData('disciplineId');
        onReturn(disciplineId);
    };

    return (
        <div
            className={styles.container}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <h2 className={styles.title}>Список дисциплин</h2>
            <div className={styles.list}>
                {disciplines.map(discipline => (
                    <DisciplineCard
                        key={discipline.id}
                        discipline={discipline}
                        onDragStart={(e) => handleDragStart(e, discipline)}
                        onClick={() => onDisciplineClick(discipline)}
                    />
                ))}
            </div>
        </div>
    );
};