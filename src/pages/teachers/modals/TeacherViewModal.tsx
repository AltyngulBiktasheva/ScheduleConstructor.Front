import React, { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { TeacherForm } from '../tabs/TeacherForm';
import type { Teacher, TimeWish, AudienceWish } from '../../../types/teacher';
import { DAYS } from '../../../constants/days';
import styles from './TeacherViewModal.module.scss';

interface Props {
  teacher: Teacher;
  onClose: () => void;
  onUpdate: (t: Teacher) => void;
  onDelete: (id: string) => void;
}

type Mode = 'view' | 'edit' | 'confirm-delete';

const BUILDING_LABELS: Record<string, string> = {
  turgeneva: 'Тургенева',
  kuybysheva: 'Куйбышева',
  online: 'Онлайн',
  other: 'Другой',
};

export const TeacherViewModal: React.FC<Props> = ({
  teacher,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [mode, setMode] = useState<Mode>('view');

  if (mode === 'edit') {
    return (
      <Modal title="Редактирование преподавателя" onClose={onClose} width={480}>
        <TeacherForm
          initial={teacher}
          onSave={(updated) => { onUpdate(updated); setMode('view'); }}
          onCancel={() => setMode('view')}
        />
      </Modal>
    );
  }

  if (mode === 'confirm-delete') {
    return (
      <Modal
        title="Удаление преподавателя"
        onClose={() => setMode('view')}
        actions={
          <>
            <Button variant="secondary" onClick={() => setMode('view')}>Нет</Button>
            <Button variant="danger" onClick={() => onDelete(teacher.id)}>Да, удалить</Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          Действительно хотите удалить преподавателя{' '}
          <strong>«{teacher.name}»</strong>?
        </p>
      </Modal>
    );
  }

  const { wishes } = teacher;
  const hasAnyWish =
    wishes.preferredTimes.length > 0 ||
    wishes.undesirableTimes.length > 0 ||
    wishes.forbiddenTimes.length > 0 ||
    wishes.preferredAudiences.length > 0 ||
    wishes.undesirableAudiences.length > 0 ||
    wishes.forbiddenAudiences.length > 0 ||
    wishes.comment.trim().length > 0;

  return (
    <Modal
      title={teacher.name}
      onClose={onClose}
      width={580}
      actions={
        <>
          <Button variant="danger" size="sm" onClick={() => setMode('confirm-delete')}>Удалить</Button>
          <Button variant="primary" size="sm" onClick={() => setMode('edit')}>Редактировать</Button>
        </>
      }
    >
      <div className={styles.view}>
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Пожелания</h4>
          {!hasAnyWish ? (
            <p className={styles.noWishes}>Пожелания не указаны</p>
          ) : (
            <div className={styles.wishGroups}>
              <TimeWishGroup
                label="Желаемое время"
                variant="preferred"
                items={wishes.preferredTimes}
              />
              <TimeWishGroup
                label="Нежелательное время"
                variant="undesirable"
                items={wishes.undesirableTimes}
              />
              <TimeWishGroup
                label="Запрещённое время"
                variant="forbidden"
                items={wishes.forbiddenTimes}
              />
              <AudienceWishGroup
                label="Желаемые аудитории"
                variant="preferred"
                items={wishes.preferredAudiences}
              />
              <AudienceWishGroup
                label="Нежелательные аудитории"
                variant="undesirable"
                items={wishes.undesirableAudiences}
              />
              <AudienceWishGroup
                label="Запрещённые аудитории"
                variant="forbidden"
                items={wishes.forbiddenAudiences}
              />
              {wishes.comment.trim() && (
                <div className={styles.wishGroup}>
                  <span className={styles.wishGroupLabel}>Комментарий</span>
                  <p className={styles.comment}>{wishes.comment}</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

type WishVariant = 'preferred' | 'undesirable' | 'forbidden';

// const VARIANT_LABEL: Record<WishVariant, string> = {
//   preferred:   'preferred',
//   undesirable: 'undesirable',
//   forbidden:   'forbidden',
// };

const TimeWishGroup: React.FC<{
  label: string;
  variant: WishVariant;
  items: TimeWish[];
}> = ({ label, variant, items }) => {
  if (items.length === 0) return null;
  return (
    <div className={styles.wishGroup}>
      <span className={`${styles.wishGroupLabel} ${styles[variant]}`}>{label}</span>
      <ul className={styles.wishList}>
        {items.map((item) => {
          const day = DAYS.find((d) => d.id === item.dayId)?.name ?? item.dayId;
          return (
            <li key={item.id}>
              {day}, {item.timeStart}–{item.timeEnd}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const AudienceWishGroup: React.FC<{
  label: string;
  variant: WishVariant;
  items: AudienceWish[];
}> = ({ label, variant, items }) => {
  if (items.length === 0) return null;
  return (
    <div className={styles.wishGroup}>
      <span className={`${styles.wishGroupLabel} ${styles[variant]}`}>{label}</span>
      <ul className={styles.wishList}>
        {items.map((item) => {
          const building = item.building === 'other'
            ? (item.buildingName ?? 'Другой')
            : (BUILDING_LABELS[item.building] ?? item.building);
          return (
            <li key={item.id}>
              {building}{item.audience ? `, ауд. ${item.audience}` : ''}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
