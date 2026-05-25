import React, { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { StreamForm } from '../tabs/StreamForm';
import type { Group, Stream } from '../../../types/group';
import styles from './StreamViewModal.module.scss';

interface Props {
  stream: Stream;
  groups: Group[];
  streams: Stream[];
  onClose: () => void;
  onUpdate: (s: Stream) => void;
  onDelete: (id: string) => void;
}

type Mode = 'view' | 'edit' | 'confirm-delete';

export const StreamViewModal: React.FC<Props> = ({
  stream, groups, streams, onClose, onUpdate, onDelete,
}) => {
  const [mode, setMode] = useState<Mode>('view');

  const streamGroups = groups.filter((g) => stream.groupIds.includes(g.id));
  const totalStudents = streamGroups.reduce((sum, g) => sum + g.studentCount, 0);

  if (mode === 'edit') {
    return (
      <Modal title="Редактирование потока" onClose={onClose} width={520}>
        <StreamForm
          initial={stream}
          groups={groups}
          streams={streams}
          onSave={(updated) => { onUpdate(updated); setMode('view'); }}
          onCancel={() => setMode('view')}
        />
      </Modal>
    );
  }

  if (mode === 'confirm-delete') {
    return (
      <Modal
        title="Удаление потока"
        onClose={() => setMode('view')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setMode('view')}>Нет</Button>
            <Button variant="danger" onClick={() => onDelete(stream.id)}>Да, удалить</Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Действительно хотите удалить поток <strong>«{stream.name}»</strong>?
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title={stream.name}
      onClose={onClose}
      width={500}
      actions={
        <>
          <Button variant="danger" size="sm" onClick={() => setMode('confirm-delete')}>Удалить</Button>
          <Button variant="primary" size="sm" onClick={() => setMode('edit')}>Редактировать</Button>
        </>
      }
    >
      <div className={styles.view}>
        <Row label="Студентов">{totalStudents} чел.</Row>
        <Row label="Групп">{streamGroups.length} шт.</Row>
        <Row label="Список групп">
          {streamGroups.length > 0 ? (
            <ul className={styles.groupList}>
              {streamGroups.map((g) => (
                <li key={g.id}>
                  <span className={styles.groupName}>{g.name}</span>
                  <span className={styles.groupCount}>{g.studentCount} чел.</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className={styles.none}>Нет групп</span>
          )}
        </Row>
      </div>
    </Modal>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className={styles.row}>
    <span className={styles.label}>{label}</span>
    <div className={styles.value}>{children}</div>
  </div>
);
