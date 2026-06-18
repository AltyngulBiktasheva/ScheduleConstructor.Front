import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { MainContainer } from '../../components/MainContainer/MainContainer';
import { ScheduleSelector } from '../../components/ScheduleSelector/ScheduleSelector';
import { ClassroomSlice } from './slices/ClassroomSlice';
import { TeacherSlice } from './slices/TeacherSlice';
import { GroupSlice } from './slices/GroupSlice';
import { TOUR_TAB_SWITCH } from '../../components/Tour';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'groups', label: 'Группы' },
  { id: 'teachers', label: 'Преподаватели' },
  { id: 'classrooms', label: 'Аудитории' },
];

type SliceType = 'classrooms' | 'teachers' | 'groups';

interface SliceSelection {
  type: SliceType;
  entityId: string | string[];
  label: string;
}

export const ConstructorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SliceType>('groups');
  const [selection, setSelection] = useState<SliceSelection | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      setActiveTab((e as CustomEvent).detail.tabId as SliceType);
    };
    window.addEventListener(TOUR_TAB_SWITCH, handler);
    return () => window.removeEventListener(TOUR_TAB_SWITCH, handler);
  }, []);

  const handleSelect = (entityId: string | string[], label: string) => {
    setSelection({ type: activeTab, entityId, label });
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id as SliceType);
    setSelection(null);
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Конструктор расписания"
        subtitle="Составьте расписание для аудиторий, преподавателей или групп"
      />
      <ScheduleSelector />

      {!selection ? (
        <>
          <div data-tour="constructor-tabs">
            <Tabs tabs={TABS} activeId={activeTab} onChange={handleTabChange} />
          </div>
          <div className={styles.sliceContainer}>
            {activeTab === 'classrooms' && <ClassroomSlice onSelect={handleSelect} />}
            {activeTab === 'teachers' && <TeacherSlice onSelect={handleSelect} />}
            {activeTab === 'groups' && <GroupSlice onSelect={handleSelect} />}
          </div>
        </>
      ) : (
        <div className={styles.gridView}>
          <div className={styles.gridHeader}>
            <div className={styles.breadcrumb}>
              <button className={styles.backBtn} onClick={() => setSelection(null)}>
                ← Назад к выбору
              </button>
              <span className={styles.selectionLabel}>{selection.label}</span>
            </div>
          </div>
          <MainContainer selection={selection} />
        </div>
      )}
    </div>
  );
};
