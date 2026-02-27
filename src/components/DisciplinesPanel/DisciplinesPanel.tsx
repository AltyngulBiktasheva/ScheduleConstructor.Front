import { type FC } from 'react';
import styles from './DisciplinesPanel.module.scss';
import { DisciplineCard } from './DisciplineCard';
import { type Discipline } from '../../types/discipline.types';

interface DisciplinesPanelProps {
    disciplines: Discipline[];
    onDragStart?: (discipline: Discipline) => void;
}

export const DisciplinesPanel: FC<DisciplinesPanelProps> = ({
    disciplines,
    onDragStart
}) => {
    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <h3>📚 Доступные дисциплины</h3>
                <p>Перетащите дисциплину в расписание</p>
            </div>

            <div className={styles.disciplinesList}>
                {disciplines.map((discipline) => (
                    <DisciplineCard
                        key={discipline.id}
                        discipline={discipline}
                        onDragStart={onDragStart || (() => {})}
                    />
                ))}
            </div>

            <div className={styles.footer}>
        <span className={styles.total}>
          Всего: {disciplines.length} дисциплин
        </span>
            </div>
        </div>
    );
};