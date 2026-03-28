export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';

// ── Детальные слайсы ──────────────────────────────────────────────────────────
export * from './slices/academicDisciplineSlice';
export * from './slices/campusSlice';
export * from './slices/lessonSlice';
export * from './slices/roomSlice';
export * from './slices/scheduleSlice';
export * from './slices/studentGroupSlice';
export * from './slices/teacherSlice';
export * from './slices/teacherPreferenceSlice';

// ── Списочные слайсы ──────────────────────────────────────────────────────────
export * from './slices/teachersListSlice';
export * from './slices/classroomsListSlice';
export * from './slices/disciplinesListSlice';
export * from './slices/groupsListSlice';
