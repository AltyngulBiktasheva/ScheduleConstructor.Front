import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { DisciplinesList } from './tabs/DisciplinesList';
import { DisciplineForm } from './tabs/DisciplineForm';
import { useDisciplines } from '../../hooks/useDisciplines';
import type { Discipline } from '../../types/discipline';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'list', label: 'Список дисциплин' },
  { id: 'create', label: 'Добавить дисциплину' },
];

export const DisciplinesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const { disciplines, newlyCreatedId, add, update, remove } = useDisciplines();

  const handleCreate = (discipline: Discipline) => {
    add(discipline);
    setActiveTab('list');
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Дисциплины" subtitle="Управление учебными дисциплинами" />
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      <div className={styles.content}>
        {activeTab === 'list' && (
          <DisciplinesList
            disciplines={disciplines}
            newlyCreatedId={newlyCreatedId}
            onUpdate={update}
            onDelete={remove}
          />
        )}
        {activeTab === 'create' && (
          <DisciplineForm onSave={handleCreate} />
        )}
      </div>
    </div>
  );
};
