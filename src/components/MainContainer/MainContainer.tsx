import React, { useState, useCallback } from 'react';
import { ScheduleGrid } from '../ScheduleGrid/ScheduleGrid';
import { DisciplineList } from '../DisciplineList/DisciplineList';
import { EditModal } from '../EditModal/EditModal';
import type { Discipline } from '../../types';
import { MOCK_DISCIPLINES } from '../../mockData';
import styles from './Styles.module.scss';

export const MainContainer: React.FC = () => {
  const [disciplines, setDisciplines] = useState<Discipline[]>(MOCK_DISCIPLINES);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const handleDisciplineReturn = useCallback((disciplineId: string) => {
    setDisciplines((prev) =>
      prev.map((d) =>
        d.id === disciplineId
          ? { ...d, isInGrid: false, slotId: undefined, timeStart: undefined, timeEnd: undefined, dayId: undefined, occurrences: undefined }
          : d
      )
    );
  }, []);

  const handleDisciplineMove = useCallback(
    (disciplineId: string, dayId: string, timeStart: string, timeEnd: string) => {
      setDisciplines((prev) =>
        prev.map((d) =>
          d.id === disciplineId
            ? { ...d, isInGrid: true, dayId, timeStart, timeEnd, occurrences: undefined }
            : d
        )
      );
    },
    []
  );

  const handleDisciplineClick = useCallback((discipline: Discipline) => {
    setEditingDiscipline(discipline);
  }, []);

  const handleSaveDiscipline = useCallback((updated: Discipline) => {
    setDisciplines((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setEditingDiscipline(null);
  }, []);

  const handleToggleHighlight = useCallback((disciplineId: string) => {
    setHighlightedId((prev) => (prev === disciplineId ? null : disciplineId));
  }, []);

  return (
    <div className={styles.container}>
      <ScheduleGrid
        disciplines={disciplines}
        onMove={handleDisciplineMove}
        onDisciplineClick={handleDisciplineClick}
        onToggleHighlight={handleToggleHighlight}
        highlightedDisciplineId={highlightedId}
        weekOffset={weekOffset}
        onWeekOffsetChange={setWeekOffset}
      />
      <DisciplineList
        disciplines={disciplines.filter((d) => !d.isInGrid)}
        onReturn={handleDisciplineReturn}
        onDisciplineClick={handleDisciplineClick}
        onToggleHighlight={handleToggleHighlight}
        highlightedDisciplineId={highlightedId}
      />
      {editingDiscipline && (
        <EditModal
          discipline={editingDiscipline}
          onSave={handleSaveDiscipline}
          onClose={() => setEditingDiscipline(null)}
        />
      )}
    </div>
  );
};
