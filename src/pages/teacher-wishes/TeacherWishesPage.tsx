import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { TeacherPicker } from '../../components/TeacherPicker/TeacherPicker';
import { WishesViewer } from './WishesViewer';
import { WishesEditor } from './WishesEditor';
import type { Teacher, TeacherWishes } from '../../types/teacher';
import { MOCK_TEACHERS } from '../../mockData/teachers';
import styles from './Styles.module.scss';

export const TeacherWishesPage: React.FC = () => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [wishes, setWishes] = useState<TeacherWishes | null>(null);

  const handleSelectTeacher = (t: Teacher) => {
    setTeacher(t);
    setWishes(t.wishes);
    setIsEditing(false);
  };

  const handleSave = (updated: TeacherWishes) => {
    setWishes(updated);
    setIsEditing(false);
  };

  if (!teacher || !wishes) {
    return (
      <div className={styles.page}>
        <PageHeader
          title="Мои пожелания"
          subtitle="Укажите предпочтения по времени и аудиториям"
        />
        <TeacherPicker
          teachers={MOCK_TEACHERS}
          onSelect={handleSelectTeacher}
          title="Найдите себя в списке"
          subtitle="Выберите своё имя для просмотра и редактирования пожеланий"
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Мои пожелания">
        <div className={styles.headerRight}>
          <span className={styles.teacherName}>{teacher.name}</span>
          <button className={styles.changeBtn} onClick={() => { setTeacher(null); setWishes(null); }}>
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
