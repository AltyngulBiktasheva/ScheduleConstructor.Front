import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { TeacherPicker } from '../../components/TeacherPicker/TeacherPicker';
import { WishesViewer } from './WishesViewer';
import { WishesEditor } from './WishesEditor';
import type { Teacher, TeacherWishes } from '../../types/teacher';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTeachersAll, updateTeacherLocally } from '../../store/slices/teachersListSlice';
import { useEffect } from 'react';
import styles from './Styles.module.scss';

export const TeacherWishesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { teachers, loading } = useAppSelector((s) => s.teachersList);

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [wishes, setWishes] = useState<TeacherWishes | null>(null);

  useEffect(() => {
    if (teachers.length === 0) {
      dispatch(fetchTeachersAll());
    }
  }, [dispatch, teachers.length]);

  const handleSelectTeacher = (t: Teacher) => {
    setTeacher(t);
    setWishes(t.wishes);
    setIsEditing(false);
  };

  const handleSave = (updated: TeacherWishes) => {
    setWishes(updated);
    setIsEditing(false);
    if (teacher) {
      dispatch(updateTeacherLocally({ ...teacher, wishes: updated }));
    }
  };

  if (!teacher || !wishes) {
    return (
      <div className={styles.page}>
        <PageHeader
          title="Мои пожелания"
          subtitle="Укажите предпочтения по времени и аудиториям"
        />
        {loading ? (
          <div className={styles.loading}>Загрузка преподавателей…</div>
        ) : (
          <TeacherPicker
            teachers={teachers}
            onSelect={handleSelectTeacher}
            title="Найдите себя в списке"
            subtitle="Выберите своё имя для просмотра и редактирования пожеланий"
          />
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Мои пожелания">
        <div className={styles.headerRight}>
          <span className={styles.teacherName}>{teacher.name}</span>
          <button
            className={styles.changeBtn}
            onClick={() => { setTeacher(null); setWishes(null); }}
          >
            Сменить
          </button>
        </div>
      </PageHeader>

      <div className={styles.content}>
        {isEditing ? (
          <WishesEditor
            wishes={wishes}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <WishesViewer
            wishes={wishes}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </div>
    </div>
  );
};
