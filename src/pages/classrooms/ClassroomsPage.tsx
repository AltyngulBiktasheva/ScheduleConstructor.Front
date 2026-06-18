import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { ScheduleSelector } from '../../components/ScheduleSelector/ScheduleSelector';
import { ClassroomsList } from './tabs/ClassroomsList';
import { ClassroomForm } from './tabs/ClassroomForm';
import { useClassrooms } from '../../hooks/useClassrooms';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setClassroomsPage, setClassroomsItemsPerPage, fetchClassroomsAll } from '../../store/slices/classroomsListSlice';
import { Pagination } from '../../components/Pagination/Pagination';
import { TOUR_TAB_SWITCH } from '../../components/Tour';
import type { Classroom } from '../../types/classroom';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'list',   label: 'Список аудиторий' },
  { id: 'create', label: 'Создать аудиторию' },
];

export const ClassroomsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    const handler = (e: Event) => setActiveTab((e as CustomEvent).detail.tabId);
    window.addEventListener(TOUR_TAB_SWITCH, handler);
    return () => window.removeEventListener(TOUR_TAB_SWITCH, handler);
  }, []);

  const dispatch = useAppDispatch();
  const { page, itemsPerPage, totalItems } = useAppSelector((s) => s.classroomsList);
  const [saving, setSaving] = useState(false);
  const { classrooms, loading, error, newlyCreatedId, add, update, remove, refetch } = useClassrooms();

  useEffect(() => {
    dispatch(fetchClassroomsAll({ page, itemsPerPage }));
  }, [dispatch, page, itemsPerPage]);

  const handleCreate = async (classroom: Classroom) => {
    setSaving(true);
    const ok = await add(classroom);
    setSaving(false);
    if (ok) setActiveTab('list');
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Аудитории" subtitle="Управление учебными аудиториями" />
      <ScheduleSelector />
      <div data-tour="page-tabs">
        <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      </div>
      <div className={styles.content} data-tour="page-content">
        {activeTab === 'list' && (
          <>
            {error && classrooms.length === 0 && (
              <div className={styles.loadError}>
                <p>Не удалось загрузить данные</p>
                <button onClick={refetch}>Повторить</button>
              </div>
            )}
            {(!error || classrooms.length > 0) && (
              <>
                <ClassroomsList
                  classrooms={classrooms}
                  newlyCreatedId={newlyCreatedId}
                  onUpdate={update}
                  onDelete={remove}
                />
                <Pagination
                  page={page}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  onPageChange={(p) => dispatch(setClassroomsPage(p))}
                  onItemsPerPageChange={(s) => dispatch(setClassroomsItemsPerPage(s))}
                />
              </>
            )}
          </>
        )}
        {activeTab === 'create' && (
          <div data-tour="form-area">
            <ClassroomForm onSave={handleCreate} loading={saving} />
          </div>
        )}
      </div>
    </div>
  );
};
