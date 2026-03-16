import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { MainContainer } from '../../components/MainContainer/MainContainer';
import { ClassroomSlice } from './slices/ClassroomSlice';
import { TeacherSlice } from './slices/TeacherSlice';
import { GroupSlice } from './slices/GroupSlice';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'classrooms', label: 'Аудитории' },
  { id: 'teachers', label: 'Преподаватели' },
  { id: 'groups', label: 'Группы' },
];

type SliceType = 'classrooms' | 'teachers' | 'groups';

interface SliceSelection {
  type: SliceType;
  entityId: string | string[];
  label: string;
}

export const ConstructorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SliceType>('classrooms');
  const [selection, setSelection] = useState<SliceSelection | null>(null);

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

      {!selection ? (
        <>
          <Tabs tabs={TABS} activeId={activeTab} onChange={handleTabChange} />
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
          <MainContainer />
        </div>
      )}
    </div>
  );
};
