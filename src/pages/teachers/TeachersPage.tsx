import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { ScheduleSelector } from '../../components/ScheduleSelector/ScheduleSelector';
import { TeachersList } from './tabs/TeachersList';
import { TeacherForm } from './tabs/TeacherForm';
import { useTeachers } from '../../hooks/useTeachers';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setTeachersPage, setTeachersItemsPerPage, fetchTeachersAll } from '../../store/slices/teachersListSlice';
import { Pagination } from '../../components/Pagination/Pagination';
import type { Teacher } from '../../types/teacher';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'list',   label: 'Список преподавателей' },
  { id: 'create', label: 'Создать преподавателя' },
];

export const TeachersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const dispatch = useAppDispatch();
  const { page, itemsPerPage, totalItems } = useAppSelector((s) => s.teachersList);
  const [saving, setSaving] = useState(false);
  const { teachers, loading, error, newlyCreatedId, add, update, remove, refetch } = useTeachers();

  useEffect(() => {
    dispatch(fetchTeachersAll({ page, itemsPerPage }));
  }, [dispatch, page, itemsPerPage]);

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
              <>
                <TeachersList
                  teachers={teachers}
                  newlyCreatedId={newlyCreatedId}
                  onUpdate={update}
                  onDelete={remove}
                />
                <Pagination
                  page={page}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  onPageChange={(p) => dispatch(setTeachersPage(p))}
                  onItemsPerPageChange={(s) => dispatch(setTeachersItemsPerPage(s))}
                />
              </>
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
