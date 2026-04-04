import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { ScheduleSelector } from '../../components/ScheduleSelector/ScheduleSelector';
import { ClassroomsList } from './tabs/ClassroomsList';
import { ClassroomForm } from './tabs/ClassroomForm';
import { useClassrooms } from '../../hooks/useClassrooms';
import type { Classroom } from '../../types/classroom';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'list',   label: 'Список аудиторий' },
  { id: 'create', label: 'Создать аудиторию' },
];

export const ClassroomsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const { classrooms, newlyCreatedId, add, update, remove } = useClassrooms();

  const handleCreate = (classroom: Classroom) => {
    add(classroom);
    setActiveTab('list');
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Аудитории" subtitle="Управление учебными аудиториями" />
      <ScheduleSelector />
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      <div className={styles.content}>
        {activeTab === 'list' && (
          <ClassroomsList
            classrooms={classrooms}
            newlyCreatedId={newlyCreatedId}
            onUpdate={update}
            onDelete={remove}
          />
        )}
        {activeTab === 'create' && (
          <ClassroomForm onSave={handleCreate} />
        )}
      </div>
    </div>
  );
};
