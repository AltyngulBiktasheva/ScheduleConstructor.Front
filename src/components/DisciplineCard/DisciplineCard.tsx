import React from 'react';
import type { Discipline } from '../../types';
import styles from './Styles.module.scss';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface Props {
    discipline: Discipline;
    isInGrid?: boolean;
    isInYellowSlot?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onClick?: () => void;
}

export const DisciplineCard: React.FC<Props> = ({
                                                    discipline,
                                                    isInGrid = false,
                                                    isInYellowSlot = false,
                                                    onDragStart,
                                                    onClick
                                                }) => {
    const buildingLabel = {
        turgeneva: 'Тургенева',
        kuybysheva: 'Куйбышева',
        online: 'Онлайн',
        other: discipline.buildingName || 'Другой'
    }[discipline.building];

    const cardContent = (
        <div
            className={`${styles.card} ${isInGrid ? styles.inGrid : ''} ${isInYellowSlot ? styles.yellowSlot : ''}`}
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
        >
            <div className={styles.title}>{discipline.name}</div>
            <div className={styles.details}>
                {discipline.teacher && <div>{discipline.teacher}</div>}
                <div>{buildingLabel}{discipline.audience && `, ауд. ${discipline.audience}`}</div>
            </div>
        </div>
    );

    if (isInGrid && discipline.timeStart && discipline.timeEnd) {
        return (
            <Tippy content={`${discipline.timeStart} - ${discipline.timeEnd}`}>
                {cardContent}
            </Tippy>
        );
    }

    return cardContent;
};