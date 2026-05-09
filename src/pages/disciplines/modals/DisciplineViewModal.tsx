import React, { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { Badge } from '../../../components/Badge/Badge';
import { DisciplineForm } from '../tabs/DisciplineForm';
import { RootDisciplineForm } from '../tabs/RootDisciplineForm';
import type { RootDisciplineFormData } from '../tabs/RootDisciplineForm';
import { LESSON_TYPE_LABELS } from '../tabs/RootDisciplineForm';
import type { Discipline } from '../../../types';
import styles from './DisciplineViewModal.module.scss';

interface Props {
  discipline: Discipline;
  onClose: () => void;
  onUpdate: (d: Discipline) => void;
  onDelete: (id: string) => void;
}

type Mode = 'view' | 'edit' | 'confirm-delete';

export const DisciplineViewModal: React.FC<Props> = ({
  discipline,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [mode, setMode] = useState<Mode>('view');

  // ── Редактирование ─────────────────────────────────────────────────────────

  if (mode === 'edit') {
    if (discipline.isRoot) {
      const handleRootSave = (data: RootDisciplineFormData) => {
        onUpdate({
          ...discipline,
          name: data.name,
          allowedLessonTypes: data.allowedLessonTypes,
          semesterNumber: data.semesterNumber,
        });
        setMode('view');
      };

      return (
        <Modal title="Редактирование корневой дисциплины" onClose={onClose} width={560}>
          <RootDisciplineForm
            initial={{
              name: discipline.name,
              semesterNumber: discipline.semesterNumber ?? 1,
              allowedLessonTypes: discipline.allowedLessonTypes ?? [],
            }}
            onSave={handleRootSave}
            onCancel={() => setMode('view')}
          />
        </Modal>
      );
    }

    return (
      <Modal title="Редактирование дисциплины" onClose={onClose} width={640}>
        <DisciplineForm
          initial={discipline}
          onSave={(updated) => { onUpdate(updated); setMode('view'); }}
          onCancel={() => setMode('view')}
        />
      </Modal>
    );
  }

  // ── Подтверждение удаления ─────────────────────────────────────────────────

  if (mode === 'confirm-delete') {
    return (
      <Modal
        title="Удаление дисциплины"
        onClose={() => setMode('view')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setMode('view')}>Нет</Button>
            <Button variant="danger" onClick={() => onDelete(discipline.id)}>Да, удалить</Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Действительно хотите удалить дисциплину{' '}
          <strong>«{discipline.name}»</strong>?
          <br />
          Это действие нельзя отменить.
        </p>
      </Modal>
    );
  }

  // ── Просмотр ──────────────────────────────────────────────────────────────

  return (
    <Modal
      title={discipline.name}
      onClose={onClose}
      width={560}
      actions={
        <>
          {discipline.isRoot && (
            <Button variant="danger" size="sm" onClick={() => setMode('confirm-delete')}>
              Удалить
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={() => setMode('edit')}>
            Редактировать
          </Button>
        </>
      }
    >
      {discipline.isRoot ? (
        <RootView discipline={discipline} />
      ) : (
        <ChildView discipline={discipline} />
      )}
    </Modal>
  );
};

// ─── Root view ────────────────────────────────────────────────────────────────

const RootView: React.FC<{ discipline: Discipline }> = ({ discipline }) => (
  <div className={styles.view}>
    <Section title="Основное">
      <Row label="Название">{discipline.name}</Row>
      <Row label="Допустимые виды занятий">
        <div className={styles.badgeRow}>
          {(discipline.allowedLessonTypes ?? []).length === 0 ? (
            <span>—</span>
          ) : (
            (discipline.allowedLessonTypes ?? []).map((t) => (
              <Badge key={t} variant="blue">{LESSON_TYPE_LABELS[t] ?? t}</Badge>
            ))
          )}
        </div>
      </Row>
    </Section>
    {discipline.comment && (
      <Section title="Комментарий">
        <p className={styles.comment}>{discipline.comment}</p>
      </Section>
    )}
  </div>
);

// ─── Child view ───────────────────────────────────────────────────────────────

const ChildView: React.FC<{ discipline: Discipline }> = ({ discipline }) => (
  <div className={styles.view}>
    <Section title="Основное">
      {discipline.lessonType && (
        <Row label="Вид занятия">
          <Badge variant="purple">{LESSON_TYPE_LABELS[discipline.lessonType] ?? discipline.lessonType}</Badge>
        </Row>
      )}
      {discipline.totalHoursCount != null && (
        <Row label="Количество часов">{discipline.totalHoursCount} ч.</Row>
      )}
      <Row label="Тип">
        <div className={styles.badgeRow}>
          <Badge variant={discipline.isStatic ? 'blue' : 'gray'}>
            {discipline.isStatic ? 'Постоянная' : 'Непостоянная'}
          </Badge>
          <Badge variant={discipline.canOverlap ? 'purple' : 'gray'}>
            {discipline.canOverlap ? 'По выбору' : 'Обязательная'}
          </Badge>
        </div>
      </Row>
      {discipline.forIds.length > 0 && (
        <Row label="Группа">{discipline.forIds.join(', ')}</Row>
      )}
      {discipline.dateRange && (
        <Row label="Период">
          {discipline.dateRange.from} — {discipline.dateRange.to}
        </Row>
      )}
    </Section>
    {discipline.comment && (
      <Section title="Комментарий">
        <p className={styles.comment}>{discipline.comment}</p>
      </Section>
    )}
  </div>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className={styles.section}>
    <h4 className={styles.sectionTitle}>{title}</h4>
    {children}
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className={styles.row}>
    <span className={styles.rowLabel}>{label}</span>
    <span className={styles.rowValue}>{children}</span>
  </div>
);
