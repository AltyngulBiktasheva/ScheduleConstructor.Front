import React, { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { ScheduleForm } from '../tabs/ScheduleForm';
import type { SaveScheduleDto, ScheduleRegistryItemDto } from '../../../api';
import styles from './ScheduleViewModal.module.scss';

interface Props {
  schedule: ScheduleRegistryItemDto;
  onClose: () => void;
  onUpdate: (s: ScheduleRegistryItemDto) => void;
  onDelete: (id: string) => void;
}

type Mode = 'view' | 'edit' | 'confirm-delete';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export const ScheduleViewModal: React.FC<Props> = ({ schedule, onClose, onUpdate, onDelete }) => {
  const [mode, setMode] = useState<Mode>('view');

  if (mode === 'edit') {
    return (
      <Modal title="Редактирование расписания" onClose={onClose} width={560}>
        <ScheduleForm
          initial={schedule}
          onSave={(dto: SaveScheduleDto) => {
            onUpdate({
              ...schedule,
              name: dto.name,
              startsWithEvenWeek: dto.startsWithEvenWeek,
              startDate: dto.startDate,
              endDate: dto.endDate,
            });
            setMode('view');
          }}
          onCancel={() => setMode('view')}
        />
      </Modal>
    );
  }

  if (mode === 'confirm-delete') {
    return (
      <Modal
        title="Удаление расписания"
        onClose={() => setMode('view')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setMode('view')}>Нет</Button>
            <Button variant="danger" onClick={() => onDelete(schedule.id)}>Да, удалить</Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Действительно хотите удалить проект расписания{' '}
          <strong>«{schedule.name}»</strong>?
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title={schedule.name}
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
        <Row label="Начало семестра">{formatDate(schedule.startDate)}</Row>
        <Row label="Конец семестра">{formatDate(schedule.endDate)}</Row>
        <Row label="Первая неделя">{schedule.startsWithEvenWeek ? 'Чётная' : 'Нечётная'}</Row>
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
