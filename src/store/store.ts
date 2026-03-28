import { configureStore } from '@reduxjs/toolkit';

// ── Детальные слайсы (одна запись) ────────────────────────────────────────────
import academicDisciplineReducer from './slices/academicDisciplineSlice';
import campusReducer from './slices/campusSlice';
import lessonReducer from './slices/lessonSlice';
import roomReducer from './slices/roomSlice';
import scheduleReducer from './slices/scheduleSlice';
import studentGroupReducer from './slices/studentGroupSlice';
import teacherReducer from './slices/teacherSlice';
import teacherPreferenceReducer from './slices/teacherPreferenceSlice';

// ── Списочные слайсы (коллекции для страниц) ──────────────────────────────────
import teachersListReducer from './slices/teachersListSlice';
import classroomsListReducer from './slices/classroomsListSlice';
import disciplinesListReducer from './slices/disciplinesListSlice';
import groupsListReducer from './slices/groupsListSlice';

export const store = configureStore({
  reducer: {
    // детальные
    academicDiscipline: academicDisciplineReducer,
    campus: campusReducer,
    lesson: lessonReducer,
    room: roomReducer,
    schedule: scheduleReducer,
    studentGroup: studentGroupReducer,
    teacher: teacherReducer,
    teacherPreference: teacherPreferenceReducer,
    // списочные
    teachersList: teachersListReducer,
    classroomsList: classroomsListReducer,
    disciplinesList: disciplinesListReducer,
    groupsList: groupsListReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
