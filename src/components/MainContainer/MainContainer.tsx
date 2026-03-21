import React, { useState, useCallback } from 'react';
import { ScheduleGrid } from '../ScheduleGrid/ScheduleGrid';
import { DisciplineList } from '../DisciplineList/DisciplineList';
import { EditModal } from '../EditModal/EditModal';
import type { Discipline } from '../../types';
import type { SlotHighlight } from '../../api/slotHighlights';
import { fetchSlotHighlights } from '../../api/slotHighlights';
import { MOCK_DISCIPLINES } from '../../mockData';
import styles from './Styles.module.scss';

export const MainContainer: React.FC = () => {
  const [disciplines, setDisciplines] = useState<Discipline[]>(MOCK_DISCIPLINES);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [loadingHighlightId, setLoadingHighlightId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<SlotHighlight[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  // Статичные дисциплины нельзя возвращать в список
  const handleDisciplineReturn = useCallback((disciplineId: string) => {
    setDisciplines((prev) =>
      prev.map((d) => {
        if (d.id !== disciplineId || d.isStatic) return d;
        return { ...d, isInGrid: false, slotId: undefined, timeStart: undefined, timeEnd: undefined, dayId: undefined, occurrences: undefined };
      })
    );
  }, []);

  // Статичные дисциплины нельзя двигать
  const handleDisciplineMove = useCallback(
    (disciplineId: string, dayId: string, timeStart: string, timeEnd: string) => {
      setDisciplines((prev) =>
        prev.map((d) => {
          if (d.id !== disciplineId || d.isStatic) return d;
          return { ...d, isInGrid: true, dayId, timeStart, timeEnd, occurrences: undefined };
        })
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

  // Кнопка-глазок: запрашиваем подсветку с бэка (мок), красим слоты
  const handleToggleHighlight = useCallback(async (disciplineId: string) => {
    // Если уже активна — выключаем
    if (highlightedId === disciplineId) {
      setHighlightedId(null);
      setHighlights([]);
      return;
    }

    const discipline = disciplines.find((d) => d.id === disciplineId);
    if (!discipline) return;

    setLoadingHighlightId(disciplineId);
    setHighlightedId(null);
    setHighlights([]);

    try {
      const result = await fetchSlotHighlights(discipline);
      setHighlights(result);
      setHighlightedId(disciplineId);
    } finally {
      setLoadingHighlightId(null);
    }
  }, [highlightedId, disciplines]);

  return (
    <div className={styles.container}>
      <ScheduleGrid
        disciplines={disciplines}
        highlights={highlights}
        onMove={handleDisciplineMove}
        onDisciplineClick={handleDisciplineClick}
        onToggleHighlight={handleToggleHighlight}
        highlightedDisciplineId={highlightedId}
        loadingHighlightId={loadingHighlightId}
        weekOffset={weekOffset}
        onWeekOffsetChange={setWeekOffset}
      />
      <DisciplineList
        disciplines={disciplines.filter((d) => !d.isInGrid)}
        onReturn={handleDisciplineReturn}
        onDisciplineClick={handleDisciplineClick}
        onToggleHighlight={handleToggleHighlight}
        highlightedDisciplineId={highlightedId}
        loadingHighlightId={loadingHighlightId}
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
