import { useState, useCallback } from 'react';
import type { Discipline } from '../types/discipline';
import { MOCK_DISCIPLINES_LIST } from '../mockData/disciplines';

export function useDisciplines() {
  const [disciplines, setDisciplines] = useState<Discipline[]>(MOCK_DISCIPLINES_LIST);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  const add = useCallback((discipline: Discipline) => {
    setDisciplines((prev) => [...prev, discipline]);
    setNewlyCreatedId(discipline.id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  }, []);

  const update = useCallback((updated: Discipline) => {
    setDisciplines((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }, []);

  const remove = useCallback((id: string) => {
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return { disciplines, newlyCreatedId, add, update, remove };
}
