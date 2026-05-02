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
  const [saving, setSaving] = useState(false);
  const { teachers, loading, error, newlyCreatedId, add, update, remove, refetch } = useTeachers();

  const handleCreate = async (teacher: Teacher) => {
    setSaving(true);
    const ok = await add(teacher);
    setSaving(false);
    if (ok) setActiveTab('list');
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Преподаватели" subtitle="Управление преподавателями и их пожеланиями" />
      <ScheduleSelector />
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      <div className={styles.content}>
        {activeTab === 'list' && (
          <>
            {error && teachers.length === 0 && (
              <div className={styles.loadError}>
                <p>Не удалось загрузить данные</p>
                <button onClick={refetch}>Повторить</button>
              </div>
            )}
            {(!error || teachers.length > 0) && (
              <TeachersList
                teachers={teachers}
                newlyCreatedId={newlyCreatedId}
                onUpdate={update}
                onDelete={remove}
              />
            )}
          </>
        )}
        {activeTab === 'create' && (
          <TeacherForm onSave={handleCreate} loading={saving} />
        )}
      </div>
    </div>
  );
};
