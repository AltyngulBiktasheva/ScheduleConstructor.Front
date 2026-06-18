import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { TeacherPicker } from '../../components/TeacherPicker/TeacherPicker';
import { ScheduleGrid } from '../../components/ScheduleGrid/ScheduleGrid';
import { LessonViewModal } from '../../components/LessonViewModal/LessonViewModal';
import type { Discipline } from '../../types';
import type { Teacher } from '../../types/teacher';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTeachersAll } from '../../store/slices/teachersListSlice';
import { fetchWeekLessons } from '../../store/slices/lessonSlice';
import { fetchSchedules } from '../../store/slices/scheduleSlice';
import { getWeekDates } from '../../utils/dateUtils';
import { lessonToDiscipline } from '../../utils/lessonMappers';
import styles from './Styles.module.scss';

export const TeacherSchedulePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { teachers, loading: teachersLoading, error: teachersError } = useAppSelector((s) => s.teachersList);
  const { weekLessons: rawWeekLessons, weekLessonsLoading } = useAppSelector((s) => s.lesson);
  const weekLessons = rawWeekLessons ?? [];
  const selectedScheduleId = useAppSelector((s) => s.schedule.selectedScheduleId);
  const scheduleDateInterval = useAppSelector((s) =>
    s.schedule.list.find((sc) => sc.id === s.schedule.selectedScheduleId)?.dateInterval ?? null
  );

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [viewingDiscipline, setViewingDiscipline] = useState<Discipline | null>(null);

  const handleDisciplineClick = useCallback((d: Discipline) => setViewingDiscipline(d), []);

  useEffect(() => {
    if (teachers.length === 0) dispatch(fetchTeachersAll());
    if (!selectedScheduleId) dispatch(fetchSchedules());
  }, [dispatch, teachers.length, selectedScheduleId, retryKey]);

  useEffect(() => {
    if (!selectedScheduleId || !teacher) return;
    const dates = getWeekDates(weekOffset);
    dispatch(fetchWeekLessons({
      scheduleId: selectedScheduleId,
      dateFrom: dates[0],
      dateTo: dates[5],
    }));
  }, [dispatch, selectedScheduleId, teacher, weekOffset]);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const gridDisciplines = useMemo(() => {
    if (!teacher) return [];
    const teacherLessons = weekLessons.filter((l) =>
      (l.teachers ?? []).some((t) => t.id === teacher.id) && l.dateWithTimeInterval != null
    );
    return teacherLessons.map((l) => lessonToDiscipline(l, weekDates));
  }, [teacher, weekLessons, weekDates]);

  const loadError = teachersError && teachers.length === 0;

  if (!teacher) {
    return (
      <div className={styles.page}>
        <PageHeader
          title="Моё расписание"
          subtitle="Просмотр расписания занятий"
        />
        {loadError ? (
          <div className={styles.loadError}>
            <p>Не удалось загрузить данные</p>
            <button onClick={() => setRetryKey((k) => k + 1)}>Повторить</button>
          </div>
        ) : teachersLoading ? (
          <div>Загрузка…</div>
        ) : (
          <TeacherPicker
            teachers={teachers}
            onSelect={setTeacher}
            title="Найдите себя в списке"
            subtitle="Выберите своё имя, чтобы открыть расписание"
          />
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Моё расписание">
        <div className={styles.headerRight}>
          <span className={styles.teacherName}>{teacher.name}</span>
          <button className={styles.changeBtn} onClick={() => setTeacher(null)}>
            Сменить
          </button>
        </div>
      </PageHeader>

      <div className={styles.gridWrapper}>
        <ScheduleGrid
          disciplines={gridDisciplines}
          weekOffset={weekOffset}
          onWeekOffsetChange={setWeekOffset}
          scheduleDateInterval={scheduleDateInterval}
          loading={weekLessonsLoading}
          readOnly
          onDisciplineClick={handleDisciplineClick}
        />
      </div>

      {viewingDiscipline && (
        <LessonViewModal
          discipline={viewingDiscipline}
          onClose={() => setViewingDiscipline(null)}
        />
      )}
    </div>
  );
};
