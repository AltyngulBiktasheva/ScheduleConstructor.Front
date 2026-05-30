import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { ScheduleSelector } from '../../components/ScheduleSelector/ScheduleSelector';
import { GroupsList } from './tabs/GroupsList';
import { GroupForm } from './tabs/GroupForm';
import { StreamForm } from './tabs/StreamForm';
import { useGroups } from '../../hooks/useGroups';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setGroupsPage, setGroupsItemsPerPage, fetchGroupsAll } from '../../store/slices/groupsListSlice';
import { Pagination } from '../../components/Pagination/Pagination';
import type { Group, Stream } from '../../types/group';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'list',          label: 'Список групп' },
  { id: 'create-group',  label: 'Создать группу' },
  { id: 'create-stream', label: 'Создать поток' },
];

export const GroupsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const dispatch = useAppDispatch();
  const { page, itemsPerPage, totalItems } = useAppSelector((s) => s.groupsList);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingStream, setSavingStream] = useState(false);
  const {
    groups, streams, loading, error, newlyCreatedId,
    addGroup, updateGroup, removeGroup,
    addStream, updateStream, removeStream,
    refetch,
  } = useGroups();

  useEffect(() => {
    dispatch(fetchGroupsAll({ page, itemsPerPage }));
  }, [dispatch, page, itemsPerPage]);

  const handleCreateGroup = async (group: Group) => {
    setSavingGroup(true);
    const ok = await addGroup(group);
    setSavingGroup(false);
    if (ok) setActiveTab('list');
  };

  const handleCreateStream = async (stream: Stream) => {
    setSavingStream(true);
    const ok = await addStream(stream);
    setSavingStream(false);
    if (ok) setActiveTab('list');
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Академические группы" subtitle="Управление потоками, группами и командами" />
      <ScheduleSelector />
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      <div className={styles.content}>
        {activeTab === 'list' && (
          <>
            {error && groups.length === 0 && streams.length === 0 && (
              <div className={styles.loadError}>
                <p>Не удалось загрузить данные</p>
                <button onClick={refetch}>Повторить</button>
              </div>
            )}
            {(!error || groups.length > 0 || streams.length > 0) && (
              <>
                <GroupsList
                  groups={groups}
                  streams={streams}
                  newlyCreatedId={newlyCreatedId}
                  onUpdateGroup={updateGroup}
                  onDeleteGroup={removeGroup}
                  onUpdateStream={updateStream}
                  onDeleteStream={removeStream}
                />
                <Pagination
                  page={page}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  onPageChange={(p) => dispatch(setGroupsPage(p))}
                  onItemsPerPageChange={(s) => dispatch(setGroupsItemsPerPage(s))}
                />
              </>
            )}
          </>
        )}
        {activeTab === 'create-group' && (
          <GroupForm streams={streams} onSave={handleCreateGroup} loading={savingGroup} />
        )}
        {activeTab === 'create-stream' && (
          <StreamForm
            groups={groups}
            streams={streams}
            onSave={handleCreateStream}
            loading={savingStream}
          />
        )}
      </div>
    </div>
  );
};
