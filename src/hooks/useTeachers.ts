import { useState, useCallback } from 'react';
import type { Teacher } from '../types/teacher';
import { MOCK_TEACHERS } from '../mockData/teachers';

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  const add = useCallback((teacher: Teacher) => {
    setTeachers((prev) => [...prev, teacher]);
    setNewlyCreatedId(teacher.id);
    setTimeout(() => setNewlyCreatedId(null), 3000);
  }, []);

  const update = useCallback((updated: Teacher) => {
    setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const remove = useCallback((id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { teachers, newlyCreatedId, add, update, remove };
}
