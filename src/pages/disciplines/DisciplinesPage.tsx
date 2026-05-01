import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { ScheduleSelector } from '../../components/ScheduleSelector/ScheduleSelector';
import { DisciplinesList } from './tabs/DisciplinesList';
import { DisciplineForm } from './tabs/DisciplineForm';
import { RootDisciplineForm } from './tabs/RootDisciplineForm';
import { useDisciplines } from '../../hooks/useDisciplines';
import { useAppSelector } from '../../store/hooks';
import type { Discipline } from '../../types/discipline';
import type { RootDisciplineFormData } from './tabs/RootDisciplineForm';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'list',        label: 'Список дисциплин' },
  { id: 'create-root', label: 'Добавить корневую дисциплину' },
  { id: 'create',      label: 'Добавить дисциплину' },
];

export const DisciplinesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const { rootDisciplines, disciplines, newlyCreatedId, add, addRoot, update, remove } = useDisciplines();
  const selectedScheduleId = useAppSelector((s) => s.schedule.selectedScheduleId);

  const handleCreateRoot = (data: RootDisciplineFormData) => {
    void addRoot(data);
    setActiveTab('list');
  };

  const handleCreate = (discipline: Discipline) => {
    void add(discipline);
    setActiveTab('list');
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Дисциплины" subtitle="Управление учебными дисциплинами" />
      <ScheduleSelector />
      {!selectedScheduleId ? (
        <div className={styles.noSchedule}>
          Для работы с дисциплинами необходимо выбрать проект расписания
        </div>
      ) : (
        <>
          <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
          <div className={styles.content}>
            {activeTab === 'list' && (
              <DisciplinesList
                rootDisciplines={rootDisciplines}
                disciplines={disciplines}
                newlyCreatedId={newlyCreatedId}
                onUpdate={update}
                onDelete={remove}
              />
            )}
            {activeTab === 'create-root' && (
              <RootDisciplineForm onSave={handleCreateRoot} />
            )}
            {activeTab === 'create' && (
              <DisciplineForm onSave={handleCreate} />
            )}
          </div>
        </>
      )}
    </div>
  );
};
