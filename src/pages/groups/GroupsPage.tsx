import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { Tabs } from '../../components/Tabs/Tabs';
import { GroupsList } from './tabs/GroupsList';
import { GroupForm } from './tabs/GroupForm';
import { StreamForm } from './tabs/StreamForm';
import { useGroups } from '../../hooks/useGroups';
import type { Group, Stream } from '../../types/group';
import styles from './Styles.module.scss';

const TABS = [
  { id: 'list',          label: 'Список групп' },
  { id: 'create-group',  label: 'Создать группу' },
  { id: 'create-stream', label: 'Создать поток' },
];

export const GroupsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const {
    groups, streams, newlyCreatedId,
    addGroup, updateGroup, removeGroup,
    addStream, updateStream, removeStream,
  } = useGroups();

  const handleCreateGroup = (group: Group) => {
    addGroup(group);
    setActiveTab('list');
  };

  const handleCreateStream = (stream: Stream) => {
    addStream(stream);
    setActiveTab('list');
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Академические группы" subtitle="Управление потоками, группами и подгруппами" />
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      <div className={styles.content}>
        {activeTab === 'list' && (
          <GroupsList
            groups={groups}
            streams={streams}
            newlyCreatedId={newlyCreatedId}
            onUpdateGroup={updateGroup}
            onDeleteGroup={removeGroup}
            onUpdateStream={updateStream}
            onDeleteStream={removeStream}
          />
        )}
        {activeTab === 'create-group' && (
          <GroupForm streams={streams} onSave={handleCreateGroup} />
        )}
        {activeTab === 'create-stream' && (
          <StreamForm onSave={handleCreateStream} />
        )}
      </div>
    </div>
  );
};
