import React, { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { Badge } from '../../../components/Badge/Badge';
import { ClassroomForm } from '../tabs/ClassroomForm';
import type { Classroom } from '../../../types/classroom';
import { CLASSROOM_TYPE_LABELS } from '../../../types/classroom';
import styles from './ClassroomViewModal.module.scss';

interface Props {
  classroom: Classroom;
  onClose: () => void;
  onUpdate: (c: Classroom) => void;
  onDelete: (id: string) => void;
}

type Mode = 'view' | 'edit' | 'confirm-delete';

const BUILDING_LABELS: Record<string, string> = {
  turgeneva: 'Тургенева',
  kuybysheva: 'Куйбышева',
  other: 'Другой',
};

const TYPE_BADGE: Record<string, 'blue' | 'green' | 'purple' | 'gray'> = {
  standard:     'gray',
  computer:     'blue',
  laboratory:   'green',
  amphitheater: 'purple',
};

export const ClassroomViewModal: React.FC<Props> = ({
  classroom,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [mode, setMode] = useState<Mode>('view');

  const buildingLabel = classroom.building === 'other'
    ? (classroom.buildingName ?? 'Другой')
    : (BUILDING_LABELS[classroom.building] ?? classroom.building);

  if (mode === 'edit') {
    return (
      <Modal title="Редактирование аудитории" onClose={onClose} width={560}>
        <ClassroomForm
          initial={classroom}
          onSave={(updated) => { onUpdate(updated); setMode('view'); }}
          onCancel={() => setMode('view')}
        />
      </Modal>
    );
  }

  if (mode === 'confirm-delete') {
    return (
      <Modal
        title="Удаление аудитории"
        onClose={() => setMode('view')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setMode('view')}>Нет</Button>
            <Button variant="danger" onClick={() => onDelete(classroom.id)}>Да, удалить</Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Действительно хотите удалить аудиторию{' '}
          <strong>«{classroom.name}»</strong> ({buildingLabel})?
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Аудитория ${classroom.name}`}
      onClose={onClose}
      width={480}
      actions={
        <>
          <Button variant="danger" size="sm" onClick={() => setMode('confirm-delete')}>Удалить</Button>
          <Button variant="primary" size="sm" onClick={() => setMode('edit')}>Редактировать</Button>
        </>
      }
    >
      <div className={styles.view}>
        <Row label="Корпус">{buildingLabel}</Row>
        <Row label="Тип">
          <Badge variant={TYPE_BADGE[classroom.type] ?? 'gray'}>
            {CLASSROOM_TYPE_LABELS[classroom.type]}
          </Badge>
        </Row>
        <Row label="Вместимость">до {classroom.capacity} чел.</Row>
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
