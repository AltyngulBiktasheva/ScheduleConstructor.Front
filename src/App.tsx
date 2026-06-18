import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { ROUTES } from './router/routes';
import { useAppDispatch } from './store/hooks';
import { ensureDefaultCampuses } from './store/slices/campusSlice';
import { ToastProvider } from './components/Toast/ToastContext';
import { ToastContainer } from './components/Toast/ToastContainer';
import { TourProvider } from './components/Tour';

import { ConstructorPage } from './pages/constructor/ConstructorPage';
import { SchedulesPage } from './pages/schedules/SchedulesPage';
import { DisciplinesPage } from './pages/disciplines/DisciplinesPage';
import { ClassroomsPage } from './pages/classrooms/ClassroomsPage';
import { TeachersPage } from './pages/teachers/TeachersPage';
import { GroupsPage } from './pages/groups/GroupsPage';
import { TeacherSchedulePage } from './pages/teacher-schedule/TeacherSchedulePage';
import { TeacherWishesPage } from './pages/teacher-wishes/TeacherWishesPage';
import { StudentSchedulePage } from './pages/student-schedule/StudentSchedulePage';
import { NotFoundPage } from './pages/not-found/NotFoundPage';

import './App.css';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(ensureDefaultCampuses());
  }, [dispatch]);

  return (
    <ToastProvider>
      <BrowserRouter>
        <TourProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to={ROUTES.CONSTRUCTOR} replace />} />

              {/* Для составителей */}
              <Route path={ROUTES.CONSTRUCTOR} element={<ConstructorPage />} />
              <Route path={ROUTES.SCHEDULES} element={<SchedulesPage />} />
              <Route path={ROUTES.DISCIPLINES} element={<DisciplinesPage />} />
              <Route path={ROUTES.CLASSROOMS} element={<ClassroomsPage />} />
              <Route path={ROUTES.TEACHERS} element={<TeachersPage />} />
              <Route path={ROUTES.GROUPS} element={<GroupsPage />} />

              {/* Для преподавателей */}
              <Route path={ROUTES.TEACHER_SCHEDULE} element={<TeacherSchedulePage />} />
              <Route path={ROUTES.TEACHER_WISHES} element={<TeacherWishesPage />} />

              {/* Для студентов */}
              <Route path={ROUTES.STUDENT_SCHEDULE} element={<StudentSchedulePage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </TourProvider>
      </BrowserRouter>
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;
