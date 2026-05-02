import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { TeacherPicker } from '../../components/TeacherPicker/TeacherPicker';
import { ScheduleGrid } from '../../components/ScheduleGrid/ScheduleGrid';
import type { Teacher } from '../../types/teacher';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTeachersAll } from '../../store/slices/teachersListSlice';
import { fetchDisciplinesAll } from '../../store/slices/disciplinesListSlice';
import styles from './Styles.module.scss';

export const TeacherSchedulePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { teachers, loading: teachersLoading, error: teachersError } = useAppSelector((s) => s.teachersList);
  const {
    disciplines: rawDisciplines,
    rootDisciplines,
    loading: disciplinesLoading,
    error: disciplinesError,
  } = useAppSelector((s) => s.disciplinesList);
  const disciplines = [...rootDisciplines, ...rawDisciplines];

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (teachers.length === 0) dispatch(fetchTeachersAll());
    if (disciplines.length === 0) dispatch(fetchDisciplinesAll());
  }, [dispatch, teachers.length, disciplines.length, retryKey]);

  const loadError =
    (teachersError && teachers.length === 0) ||
    (disciplinesError && disciplines.length === 0);

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
        ) : teachersLoading || disciplinesLoading ? (
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

  const teacherDisciplines = disciplines.filter(
    (d) => d.teacher === teacher.name || d.teachers?.some((t) => t.name === teacher.name)
  );

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
          disciplines={teacherDisciplines}
          weekOffset={weekOffset}
          onWeekOffsetChange={setWeekOffset}
        />
      </div>
    </div>
  );
};
