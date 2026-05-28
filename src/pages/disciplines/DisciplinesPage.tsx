import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { ScheduleSelector } from '../../components/ScheduleSelector/ScheduleSelector';
import { DisciplinesList } from './tabs/DisciplinesList';
import { DisciplineForm } from './tabs/DisciplineForm';
import { RootDisciplineForm } from './tabs/RootDisciplineForm';
import { useDisciplines } from '../../hooks/useDisciplines';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setDisciplinesPage, setDisciplinesItemsPerPage, fetchDisciplinesAll } from '../../store/slices/disciplinesListSlice';
import { Pagination } from '../../components/Pagination/Pagination';
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
  const dispatch = useAppDispatch();
  const selectedScheduleId = useAppSelector((s) => s.schedule.selectedScheduleId);
  const { page, itemsPerPage, totalItems } = useAppSelector((s) => s.disciplinesList);

  useEffect(() => {
    if (selectedScheduleId) {
      dispatch(fetchDisciplinesAll({ scheduleId: selectedScheduleId, page, itemsPerPage }));
    }
  }, [dispatch, selectedScheduleId, page, itemsPerPage]);

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
                {loading && rootDisciplines.length === 0 && disciplines.length === 0 && (
                  <div className={styles.loading}>Загрузка дисциплин...</div>
                )}
                {!loading && error && rootDisciplines.length === 0 && disciplines.length === 0 && (
                  <div className={styles.loadError}>
                    <p>Не удалось загрузить данные</p>
                    <button onClick={refetch}>Повторить</button>
                  </div>
                )}
                {!loading && (!error || rootDisciplines.length > 0 || disciplines.length > 0) && (
                  <>
                    <DisciplinesList
                      rootDisciplines={rootDisciplines}
                      disciplines={disciplines}
                      newlyCreatedId={newlyCreatedId}
                      onUpdate={update}
                      onDelete={remove}
                    />
                    <Pagination
                      page={page}
                      itemsPerPage={itemsPerPage}
                      totalItems={totalItems}
                      onPageChange={(p) => dispatch(setDisciplinesPage(p))}
                      onItemsPerPageChange={(s) => dispatch(setDisciplinesItemsPerPage(s))}
                    />
                  </>
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
