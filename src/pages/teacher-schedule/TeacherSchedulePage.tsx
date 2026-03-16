import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { TeacherPicker } from '../../components/TeacherPicker/TeacherPicker';
import { ScheduleGrid } from '../../components/ScheduleGrid/ScheduleGrid';
import type { Teacher } from '../../types/teacher';
import { MOCK_TEACHERS } from '../../mockData/teachers';
import { MOCK_DISCIPLINES } from '../../mockData/schedule';
import styles from './Styles.module.scss';

export const TeacherSchedulePage: React.FC = () => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  if (!teacher) {
    return (
      <div className={styles.page}>
        <PageHeader
          title="Моё расписание"
          subtitle="Просмотр расписания занятий"
        />
        <TeacherPicker
          teachers={MOCK_TEACHERS}
          onSelect={setTeacher}
          title="Найдите себя в списке"
          subtitle="Выберите своё имя, чтобы открыть расписание"
        />
      </div>
    );
  }

  const teacherDisciplines = MOCK_DISCIPLINES.filter(
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
