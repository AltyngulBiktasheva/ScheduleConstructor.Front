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
  const [savingRoot, setSavingRoot] = useState(false);
  const [saving, setSaving] = useState(false);
  const {
    rootDisciplines, disciplines, loading, error, newlyCreatedId,
    add, addRoot, update, remove, refetch,
  } = useDisciplines();
  const selectedScheduleId = useAppSelector((s) => s.schedule.selectedScheduleId);

  const handleCreateRoot = async (data: RootDisciplineFormData) => {
    setSavingRoot(true);
    const ok = await addRoot(data);
    setSavingRoot(false);
    if (ok) setActiveTab('list');
  };

  const handleCreate = async (discipline: Discipline) => {
    setSaving(true);
    const ok = await add(discipline);
    setSaving(false);
    if (ok) setActiveTab('list');
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
              <>
                {error && rootDisciplines.length === 0 && disciplines.length === 0 && (
                  <div className={styles.loadError}>
                    <p>Не удалось загрузить данные</p>
                    <button onClick={refetch}>Повторить</button>
                  </div>
                )}
                {(!error || rootDisciplines.length > 0 || disciplines.length > 0) && (
                  <DisciplinesList
                    rootDisciplines={rootDisciplines}
                    disciplines={disciplines}
                    newlyCreatedId={newlyCreatedId}
                    onUpdate={update}
                    onDelete={remove}
                  />
                )}
              </>
            )}
            {activeTab === 'create-root' && (
              <RootDisciplineForm onSave={handleCreateRoot} loading={savingRoot} />
            )}
            {activeTab === 'create' && (
              <DisciplineForm onSave={handleCreate} loading={saving} />
            )}
          </div>
        </>
      )}
    </div>
  );
};
