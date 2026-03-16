import { useState, useCallback } from 'react';
import type { Classroom } from '../types/classroom';
import { MOCK_CLASSROOMS } from '../mockData/classrooms';

export function useClassrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>(MOCK_CLASSROOMS);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  const add = useCallback((classroom: Classroom) => {
    setClassrooms((prev) => [...prev, classroom]);
    setNewlyCreatedId(classroom.id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  }, []);

  const update = useCallback((updated: Classroom) => {
    setClassrooms((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const remove = useCallback((id: string) => {
    setClassrooms((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { classrooms, newlyCreatedId, add, update, remove };
}
