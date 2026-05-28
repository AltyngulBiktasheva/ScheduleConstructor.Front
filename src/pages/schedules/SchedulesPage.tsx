import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { SchedulesList } from './tabs/SchedulesList';
import { ScheduleForm } from './tabs/ScheduleForm';
import { useSchedule, setSchedulesPage, setSchedulesItemsPerPage, fetchSchedules } from '../../store/slices/scheduleSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Pagination } from '../../components/Pagination/Pagination';
import type { ScheduleSaveDto, ScheduleRegistryItemDto } from '../../api';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'list',   label: 'Список расписаний' },
  { id: 'create', label: 'Создать расписание' },
];

export const SchedulesPage: React.FC = () => {
  const location = useLocation();
  const initialTab = (location.state as { tab?: string } | null)?.tab ?? 'list';
  const [activeTab, setActiveTab] = useState(initialTab);
  const dispatch = useAppDispatch();
  const { page, itemsPerPage, totalItems } = useAppSelector((s) => s.schedule);
  const [saving, setSaving] = useState(false);
  const { list, error, fetchAll, save, delete: deleteSchedule } = useSchedule();
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const prevListRef = useRef<ScheduleRegistryItemDto[]>([]);

  useEffect(() => {
    dispatch(fetchSchedules({ page, itemsPerPage }));
  }, [dispatch, page, itemsPerPage]);

  // Определяем только что созданное расписание (появилось в списке)
  useEffect(() => {
    const prevIds = new Set(prevListRef.current.map((s) => s.id));
    const added = list.find((s) => !prevIds.has(s.id));
    if (added) {
      setNewlyCreatedId(added.id);
      setTimeout(() => setNewlyCreatedId(null), 3000);
    }
    prevListRef.current = list;
  }, [list]);

  const handleCreate = async (dto: ScheduleSaveDto) => {
    setSaving(true);
    const ok = await save(dto);
    setSaving(false);
    if (ok) setActiveTab('list');
  };

  const handleUpdate = async (dto: ScheduleSaveDto) => {
    await save(dto);
  };

  const handleDelete = async (id: string) => {
    await deleteSchedule(id);
  };

  // Адаптер для onUpdate в SchedulesList: принимает ScheduleRegistryItemDto
  const handleUpdateFromModal = (updated: ScheduleRegistryItemDto) => {
    void handleUpdate({
      id: updated.id,
      name: updated.name,
      dateInterval: updated.dateInterval,
    });
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Проекты расписания" subtitle="Управление проектами расписания" />
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      <div className={styles.content}>
        {activeTab === 'list' && (
          <>
            {error && list.length === 0 && (
              <div className={styles.loadError}>
                <p>Не удалось загрузить данные</p>
                <button onClick={() => fetchAll()}>Повторить</button>
              </div>
            )}
            {(!error || list.length > 0) && (
              <>
                <SchedulesList
                  schedules={list}
                  newlyCreatedId={newlyCreatedId}
                  onUpdate={handleUpdateFromModal}
                  onDelete={handleDelete}
                />
                <Pagination
                  page={page}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  onPageChange={(p) => dispatch(setSchedulesPage(p))}
                  onItemsPerPageChange={(s) => dispatch(setSchedulesItemsPerPage(s))}
                />
              </>
            )}
          </>
        )}
        {activeTab === 'create' && (
          <ScheduleForm onSave={handleCreate} loading={saving} />
        )}
      </div>
    </div>
  );
};
