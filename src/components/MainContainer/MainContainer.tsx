import React, {useState} from 'react';
import { ScheduleGrid } from '../ScheduleGrid/ScheduleGrid';
import { DisciplineList } from '../DisciplineList/DisciplineList';
import { EditModal } from '../EditModal/EditModal';
import type { Discipline, GridSlot } from '../../types';
import { MOCK_DISCIPLINES, MOCK_SLOTS } from '../../mockData';
import styles from './Styles.module.scss';

export const MainContainer: React.FC = () => {
    const [disciplines, setDisciplines] = useState<Discipline[]>(MOCK_DISCIPLINES);
    const [slots, setSlots] = useState<GridSlot[]>(MOCK_SLOTS);
    const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);

    // const handleDisciplineDrop = (disciplineId: string, slotId: string) => {
    //     setDisciplines(prev => prev.map(d =>
    //         d.id === disciplineId ? { ...d, isInGrid: true, slotId } : d
    //     ));
    //     setSlots(prev => prev.map(s =>
    //         s.id === slotId ? { ...s, disciplineId } : s
    //     ));
    // };

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
        console.log('PREV: ', disciplines);

        if (!targetSlot || targetSlot.disciplineId) {
            return;
        }

        setSlots(prev => {
            const oldSlot = prev.find(s => s.disciplineId === disciplineId);
            console.log('OLD: ', oldSlot);

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

        setDisciplines(prev => prev.map(d => {
            return d.id === disciplineId ? { ...d, slotId: targetSlotId } : d
        }));
    };

    const handleDisciplineClick = (discipline: Discipline) => {
        console.log('CLICKED DISCIPLINE: ', discipline);
        setEditingDiscipline(discipline);
    };

    const handleSaveDiscipline = (updatedDiscipline: Discipline) => {
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