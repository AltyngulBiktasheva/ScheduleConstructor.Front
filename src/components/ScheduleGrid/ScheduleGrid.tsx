import React from 'react';
import { DAYS } from '../../constants/days';
import { TIME_SLOTS, SLOT_WIDTH, SLOT_HEIGHT } from '../../constants/timeSlots';
import { TimeSlot } from '../TimeSlot/TimeSlot';
import { DisciplineCard } from '../DisciplineCard/DisciplineCard';
import type { GridSlot, Discipline } from '../../types';
import styles from './Styles.module.scss';

interface Props {
    slots: GridSlot[];
    disciplines: Discipline[];
    onMove?: (disciplineId: string, targetSlotId: string) => void;
    onDisciplineClick: (discipline: Discipline) => void;
}

export const ScheduleGrid: React.FC<Props> = ({
                                                  slots,
                                                  disciplines,
                                                  onMove,
                                                  onDisciplineClick
                                              }) => {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, slotId: string) => {
        e.preventDefault();
        const disciplineId = e.dataTransfer.getData('disciplineId');

        // Проверяем цвет слота перед перемещением
        const targetSlot = slots.find(s => s.id === slotId);
        if (targetSlot?.color === 'red') {
            alert('Нельзя разместить дисциплину в красном слоте');
            return;
        }

        onMove && onMove(disciplineId, slotId);
    };

    return (
        <div className={styles.grid}>
            <div className={styles.header}>
                <div className={styles.timeColumn}>Время</div>
                {DAYS.map(day => (
                    <div key={day.id} className={styles.dayHeader}>
                        {day.name}
                    </div>
                ))}
            </div>

            <div className={styles.body}>
                <div className={styles.timeColumn}>
                    {TIME_SLOTS.map(slot => (
                        <div key={slot.id} className={styles.timeSlot}>
                            {slot.displayStart} - {slot.displayEnd}
                        </div>
                    ))}
                </div>

                {DAYS.map(day => (
                    <div key={day.id} className={styles.dayColumn}>
                        {TIME_SLOTS.map(timeSlot => {
                            const slot = slots.find(s => s.timeSlotId === timeSlot.id && s.dayId === day.id);
                            const discipline = slot?.disciplineId
                                ? disciplines.find(d => d.id === slot.disciplineId)
                                : undefined;

                            // Проверяем, находится ли дисциплина в желтом слоте
                            const isInYellowSlot = slot?.color === 'yellow' && Boolean(discipline);

                            return (
                                <div
                                    key={`${day.id}-${timeSlot.id}`}
                                    className={styles.slotContainer}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => slot && handleDrop(e, slot.id)}
                                >
                                    {slot && (
                                        <TimeSlot
                                            slot={slot}
                                            style={{ width: SLOT_WIDTH, height: SLOT_HEIGHT }}
                                        >
                                            {discipline && (
                                                <DisciplineCard
                                                    discipline={discipline}
                                                    isInGrid={true}
                                                    isInYellowSlot={isInYellowSlot}
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('disciplineId', discipline.id);
                                                    }}
                                                    onClick={() => onDisciplineClick(discipline)}
                                                />
                                            )}
                                        </TimeSlot>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};