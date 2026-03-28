import { configureStore } from '@reduxjs/toolkit';
import academicDisciplineReducer from './slices/academicDisciplineSlice';
import campusReducer from './slices/campusSlice';
import lessonReducer from './slices/lessonSlice';
import roomReducer from './slices/roomSlice';
import scheduleReducer from './slices/scheduleSlice';
import studentGroupReducer from './slices/studentGroupSlice';
import teacherReducer from './slices/teacherSlice';
import teacherPreferenceReducer from './slices/teacherPreferenceSlice';

export const store = configureStore({
  reducer: {
    academicDiscipline: academicDisciplineReducer,
    campus: campusReducer,
    lesson: lessonReducer,
    room: roomReducer,
    schedule: scheduleReducer,
    studentGroup: studentGroupReducer,
    teacher: teacherReducer,
    teacherPreference: teacherPreferenceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
