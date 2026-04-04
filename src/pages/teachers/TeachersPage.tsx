import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { ScheduleSelector } from '../../components/ScheduleSelector/ScheduleSelector';
import { TeachersList } from './tabs/TeachersList';
import { TeacherForm } from './tabs/TeacherForm';
import { useTeachers } from '../../hooks/useTeachers';
import type { Teacher } from '../../types/teacher';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'list',   label: 'Список преподавателей' },
  { id: 'create', label: 'Создать преподавателя' },
];

export const TeachersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const { teachers, newlyCreatedId, add, update, remove } = useTeachers();

  const handleCreate = (teacher: Teacher) => {
    add(teacher);
    setActiveTab('list');
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Преподаватели" subtitle="Управление преподавателями и их пожеланиями" />
      <ScheduleSelector />
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      <div className={styles.content}>
        {activeTab === 'list' && (
          <TeachersList
            teachers={teachers}
            newlyCreatedId={newlyCreatedId}
            onUpdate={update}
            onDelete={remove}
          />
        )}
        {activeTab === 'create' && (
          <TeacherForm onSave={handleCreate} />
        )}
      </div>
    </div>
  );
};
