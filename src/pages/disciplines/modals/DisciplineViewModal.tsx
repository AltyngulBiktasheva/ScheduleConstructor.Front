import React, { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { Badge } from '../../../components/Badge/Badge';
import { DisciplineForm } from '../tabs/DisciplineForm';
import type { Discipline } from '../../../types/discipline';
import { DAYS } from '../../../constants/days';
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

  const handleSave = (updated: Discipline) => {
    onUpdate(updated);
    setMode('view');
  };

  if (mode === 'edit') {
    return (
      <Modal title="Редактирование дисциплины" onClose={onClose} width={640}>
        <DisciplineForm
          initial={discipline}
          onSave={handleSave}
          onCancel={() => setMode('view')}
        />
      </Modal>
    );
  }

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

  return (
    <Modal
      title={discipline.name}
      onClose={onClose}
      width={600}
      actions={
        <>
          <Button variant="danger" size="sm" onClick={() => setMode('confirm-delete')}>
            Удалить
          </Button>
          <Button variant="primary" size="sm" onClick={() => setMode('edit')}>
            Редактировать
          </Button>
        </>
      }
    >
      <div className={styles.view}>
        <Section title="Основное">
          <Row label="Для кого">
            <Badge variant={discipline.forType === 'stream' ? 'green' : 'gray'}>
              {discipline.forType === 'stream' ? 'Поток' : 'Группа'}
            </Badge>
          </Row>
          <Row label="Тип">
            <div className={styles.badgeRow}>
              <Badge variant={discipline.isStatic ? 'blue' : 'gray'}>
                {discipline.isStatic ? 'Статичная' : 'Не статичная'}
              </Badge>
              <Badge variant={discipline.canOverlap ? 'purple' : 'gray'}>
                {discipline.canOverlap ? 'Совмещается' : 'Не совмещается'}
              </Badge>
            </div>
          </Row>
          <Row label="Повторение">{formatRepeat(discipline.repeat)}</Row>
          {discipline.dateRange && (
            <Row label="Период">
              {discipline.dateRange.from} — {discipline.dateRange.to}
            </Row>
          )}
        </Section>

        {discipline.teachers.length > 0 && (
          <Section title="Преподаватели">
            <ul className={styles.list}>
              {discipline.teachers.map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
          </Section>
        )}

        {discipline.audiences.length > 0 && (
          <Section title="Аудитории">
            <ul className={styles.list}>
              {discipline.audiences.map((a, i) => (
                <li key={i}>{formatAudience(a)}</li>
              ))}
            </ul>
          </Section>
        )}

        {discipline.occurrences?.length && discipline.occurrences?.length > 0 && (
          <Section title="Время проведения">
            <ul className={styles.list}>
              {discipline.occurrences.map((o, i) => {
                const day = DAYS.find((d) => d.id === o.dayId)?.name ?? o.dayId;
                return <li key={i}>{day}, {o.timeStart}–{o.timeEnd}</li>;
              })}
            </ul>
          </Section>
        )}

        {discipline.comment && (
          <Section title="Комментарий">
            <p className={styles.comment}>{discipline.comment}</p>
          </Section>
        )}
      </div>
    </Modal>
  );
};

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRepeat(repeat: string) {
  const map: Record<string, string> = {
    'every-week': 'Каждую неделю',
    'once': 'Единожды',
    'every-two-weeks': 'Каждые две недели',
    'custom': 'Кастомное',
  };
  return map[repeat] ?? repeat;
}

function formatAudience(a: { building: string; buildingName?: string; audience?: string }) {
  if (a.building === 'online') return 'Онлайн';
  const b = a.building === 'turgeneva' ? 'Тургенева'
    : a.building === 'kuybysheva' ? 'Куйбышева'
    : a.buildingName ?? 'Другой';
  return a.audience ? `${b}, ауд. ${a.audience}` : b;
}
