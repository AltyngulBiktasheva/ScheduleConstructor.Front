import React, { useState, useCallback } from 'react';
import { ScheduleGrid } from '../ScheduleGrid/ScheduleGrid';
import { DisciplineList } from '../DisciplineList/DisciplineList';
import { EditModal } from '../EditModal/EditModal';
import type { Discipline } from '../../types';
import type { SlotHighlight } from '../../api/slotHighlights';
import { fetchSlotHighlights } from '../../api/slotHighlights';
import { MOCK_DISCIPLINES } from '../../mockData';
import styles from './Styles.module.scss';

// Родительская дисциплина: дисциплина без parentId
// Дочерняя дисциплина: дисциплина с parentId

function getChildrenOfParent(disciplines: Discipline[], parentId: string): Discipline[] {
  return disciplines.filter((d) => d.parentId === parentId && d.isInGrid);
}

function createChild(parent: Discipline, dayId: string, timeStart: string, timeEnd: string): Discipline {
  return {
    ...parent,
    id: `${parent.id}-child-${Date.now()}`,
    parentId: parent.id,
    isInGrid: true,
    dayId,
    timeStart,
    timeEnd,
    occurrences: undefined,
    weeklyCount: 1,
    isStatic: parent.isStatic,
  };
}

export const MainContainer: React.FC = () => {
  const [disciplines, setDisciplines] = useState<Discipline[]>(MOCK_DISCIPLINES);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [loadingHighlightId, setLoadingHighlightId] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<SlotHighlight[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  // ── Логика видимости в списке ────────────────────────────────────────────────
  // Показываем в списке только дисциплины-родители (без parentId),
  // у которых детей на сетке меньше чем weeklyCount
  const listDisciplines = disciplines.filter((d) => {
    if (d.parentId) return false;         // дети в списке не показываем
    if (d.isInGrid && d.weeklyCount <= 1) return false; // уже полностью на сетке
    const children = getChildrenOfParent(disciplines, d.id);
    return children.length < (d.weeklyCount ?? 1);
  });

  // ── Дисциплины для сетки: дети + родители с weeklyCount === 1 на сетке ───────
  const gridDisciplines = disciplines.filter((d) => d.isInGrid);

  // ── Перемещение на сетку ─────────────────────────────────────────────────────
  const handleDisciplineMove = useCallback(
    (disciplineId: string, dayId: string, timeStart: string, timeEnd: string) => {
      setDisciplines((prev) => {
        const discipline = prev.find((d) => d.id === disciplineId);
        if (!discipline) return prev;

        // Статичные нельзя двигать
        if (discipline.isStatic && discipline.isInGrid) return prev;

        const weeklyCount = discipline.weeklyCount ?? 1;
        const children = prev.filter((d) => d.parentId === disciplineId && d.isInGrid);

        // Если это родитель и weeklyCount > 1 — создаём ребёнка
        if (!discipline.parentId && weeklyCount > 1) {
          // Если родитель ещё не на сетке (первый ребёнок) — ставим родителя
          if (!discipline.isInGrid) {
            const child = createChild(discipline, dayId, timeStart, timeEnd);
            return [...prev, child];
          }
          // Если родитель уже на сетке — добавляем ещё одного ребёнка
          if (children.length < weeklyCount - 1) {
            const child = createChild(discipline, dayId, timeStart, timeEnd);
            return [...prev, child];
          }
          return prev;
        }

        // weeklyCount === 1 или это ребёнок — обычное перемещение
        return prev.map((d) =>
          d.id === disciplineId
            ? { ...d, isInGrid: true, dayId, timeStart, timeEnd, occurrences: undefined }
            : d
        );
      });
    },
    []
  );

  // ── Возврат в список ─────────────────────────────────────────────────────────
  const handleDisciplineReturn = useCallback((disciplineId: string) => {
    setDisciplines((prev) => {
      const discipline = prev.find((d) => d.id === disciplineId);
      if (!discipline || discipline.isStatic) return prev;

      // Если это ребёнок — удаляем его (родитель снова появится в списке)
      if (discipline.parentId) {
        return prev.filter((d) => d.id !== disciplineId);
      }

      // Родитель с weeklyCount === 1 — снимаем с сетки
      return prev.map((d) =>
        d.id === disciplineId
          ? { ...d, isInGrid: false, dayId: undefined, timeStart: undefined, timeEnd: undefined, occurrences: undefined }
          : d
      );
    });
  }, []);

  // ── Клик на карточку ─────────────────────────────────────────────────────────
  const handleDisciplineClick = useCallback((discipline: Discipline) => {
    // Если кликнули на ребёнка — открываем родителя с инфой о всех детях
    if (discipline.parentId) {
      setDisciplines((prev) => {
        const parent = prev.find((d) => d.id === discipline.parentId);
        if (parent) {
          const children = getChildrenOfParent(prev, parent.id);
          // Собираем occurrences из детей для отображения
          const occurrences = children.map((c) => ({
            dayId: c.dayId!,
            timeStart: c.timeStart!,
            timeEnd: c.timeEnd!,
          }));
          setEditingDiscipline({ ...parent, occurrences });
        }
        return prev;
      });
      return;
    }
    // Родитель: показываем времена детей
    const children = getChildrenOfParent(disciplines, discipline.id);
    if (children.length > 0) {
      const occurrences = children.map((c) => ({ dayId: c.dayId!, timeStart: c.timeStart!, timeEnd: c.timeEnd! }));
      setEditingDiscipline({ ...discipline, occurrences });
    } else {
      setEditingDiscipline(discipline);
    }
  }, [disciplines]);

  // ── Сохранение из EditModal ──────────────────────────────────────────────────
  const handleSaveDiscipline = useCallback((updated: Discipline) => {
    setDisciplines((prev) => {
      const existing = prev.find((d) => d.id === updated.id);
      if (!existing) return prev;

      // Если у дисциплины заданы occurrences через модалку — синхронизируем детей
      if (updated.occurrences && updated.occurrences.length > 0 && (existing.weeklyCount ?? 1) > 1) {
        const withoutOldChildren = prev.filter((d) => d.parentId !== updated.id);
        const newChildren = updated.occurrences.map((occ) =>
          createChild(updated, occ.dayId, occ.timeStart, occ.timeEnd)
        );
        return withoutOldChildren.map((d) => d.id === updated.id ? { ...updated, occurrences: undefined } : d).concat(newChildren);
      }

      return prev.map((d) => d.id === updated.id ? updated : d);
    });
    setEditingDiscipline(null);
  }, []);

  // ── Подсветка слотов ─────────────────────────────────────────────────────────
  const handleToggleHighlight = useCallback(async (disciplineId: string) => {
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
        disciplines={gridDisciplines}
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
        disciplines={listDisciplines}
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
