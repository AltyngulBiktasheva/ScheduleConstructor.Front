import React, { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { GroupForm } from '../tabs/GroupForm';
import type { Group, Stream } from '../../../types/group';
import styles from './GroupViewModal.module.scss';

interface Props {
  group: Group;
  streams: Stream[];
  onClose: () => void;
  onUpdate: (g: Group) => void;
  onDelete: (id: string) => void;
}

type Mode = 'view' | 'edit' | 'confirm-delete';

export const GroupViewModal: React.FC<Props> = ({
  group, streams, onClose, onUpdate, onDelete,
}) => {
  const [mode, setMode] = useState<Mode>('view');

  const streamName = (() => {
    const ids = group.streamIds ?? [];
    if (ids.length === 0) return '—';
    return ids.map((id) => streams.find((s) => s.id === id)?.name).filter(Boolean).join(', ') || '—';
  })();

  if (mode === 'edit') {
    return (
      <Modal title="Редактирование группы" onClose={onClose} width={560}>
        <GroupForm
          initial={group}
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
        title="Удаление группы"
        onClose={() => setMode('view')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setMode('view')}>Нет</Button>
            <Button variant="danger" onClick={() => onDelete(group.id)}>Да, удалить</Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Действительно хотите удалить группу <strong>«{group.name}»</strong>?
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title={group.name}
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
        <Row label="Поток">{streamName}</Row>
        <Row label="Студентов">{group.studentCount} чел.</Row>
        <Row label="Команды">
          {group.subgroups.length > 0
            ? group.subgroups.map((s) => s.name).join(', ')
            : <span className={styles.none}>Нет</span>
          }
        </Row>
      </div>
    </Modal>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className={styles.row}>
    <span className={styles.label}>{label}</span>
    <span className={styles.value}>{children}</span>
  </div>
);
