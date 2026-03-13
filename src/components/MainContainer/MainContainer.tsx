import React, {useState} from 'react';
import { ScheduleGrid } from '../ScheduleGrid/ScheduleGrid';
import { DisciplineList } from '../DisciplineList/DisciplineList';
import { EditModal } from '../EditModal/EditModal';
import type { Discipline, GridSlot } from '../../types';
import { TIME_SLOTS } from '../../constants/timeSlots';
import { MOCK_DISCIPLINES, MOCK_SLOTS } from '../../mockData';
import styles from './Styles.module.scss';

export const MainContainer: React.FC = () => {
    const [disciplines, setDisciplines] = useState<Discipline[]>(MOCK_DISCIPLINES);
    const [slots, setSlots] = useState<GridSlot[]>(MOCK_SLOTS);
    const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);

    const handleDisciplineReturn = (disciplineId: string) => {
        setDisciplines(prev => {
            const movedDiscipline = prev.find(d => d.id === disciplineId);
            const others = prev.filter(d => d.id !== disciplineId);
            return movedDiscipline
                ? [{ ...movedDiscipline, isInGrid: false, slotId: undefined, timeStart: undefined, timeEnd: undefined, dayId: undefined }, ...others]
                : prev;
        });

        setSlots(prev => prev.map(s =>
            s.disciplineId === disciplineId ? { ...s, disciplineId: undefined } : s
        ));
    };

    const handleDisciplineMove = (disciplineId: string, targetSlotId: string) => {
        const targetSlot = slots.find((s) => s.id === targetSlotId);

        // Проверяем, можно ли переместить дисциплину
        if (!targetSlot) {
            return;
        }

        // Нельзя перемещать в красный слот
        if (targetSlot.color === 'red') {
            alert('Нельзя разместить дисциплину в красном слоте');
            return;
        }

        // Если слот занят другой дисциплиной
        if (targetSlot.disciplineId && targetSlot.disciplineId !== disciplineId) {
            alert('Этот слот уже занят другой дисциплиной');
            return;
        }

        // Находим информацию о временном слоте
        const timeSlotInfo = TIME_SLOTS.find(ts => ts.id === targetSlot.timeSlotId);

        setSlots(prev => {
            const oldSlot = prev.find(s => s.disciplineId === disciplineId);

            return prev.map(s => {
                if (s.id === oldSlot?.id) {
                    return { ...s, disciplineId: undefined };
                }
                if (s.id === targetSlotId) {
                    return { ...s, disciplineId };
                }
                return s;
            });
        });

        setDisciplines(prev => prev.map(d =>
            d.id === disciplineId ? {
                ...d,
                slotId: targetSlotId,
                dayId: targetSlot.dayId,
                timeStart: timeSlotInfo?.start,
                timeEnd: timeSlotInfo?.end,
                isInGrid: true
            } : d
        ));
    };

    const handleDisciplineClick = (discipline: Discipline) => {
        setEditingDiscipline(discipline);
    };

    const handleSaveDiscipline = (updatedDiscipline: Discipline) => {
        // Если дисциплина была в сетке и у неё изменился slotId
        if (updatedDiscipline.isInGrid && updatedDiscipline.slotId) {
            // Очищаем старый слот
            setSlots(prev => prev.map(s =>
                s.disciplineId === updatedDiscipline.id ? { ...s, disciplineId: undefined } : s
            ));

            // Заполняем новый слот
            setSlots(prev => prev.map(s =>
                s.id === updatedDiscipline.slotId ? { ...s, disciplineId: updatedDiscipline.id } : s
            ));
        }

        setDisciplines(prev => prev.map(d =>
            d.id === updatedDiscipline.id ? updatedDiscipline : d
        ));
        setEditingDiscipline(null);
    };

    return (
        <div className={styles.container}>
            <ScheduleGrid
                slots={slots}
                disciplines={disciplines}
                onMove={handleDisciplineMove}
                onDisciplineClick={handleDisciplineClick}
            />
            <DisciplineList
                disciplines={disciplines.filter(d => !d.isInGrid)}
                onReturn={handleDisciplineReturn}
                onDisciplineClick={handleDisciplineClick}
            />
            {editingDiscipline && (
                <EditModal
                    discipline={editingDiscipline}
                    onSave={handleSaveDiscipline}
                    onClose={() => setEditingDiscipline(null)}
                    slots={slots}
                />
            )}
        </div>
    );
};