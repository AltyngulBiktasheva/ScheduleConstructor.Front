import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { TeacherForm } from '../tabs/TeacherForm';
import { teacherPreferenceApi } from '../../../api';
import type { TeacherPreferencesViewDto } from '../../../api';
import type { Teacher, TimeWish, AudienceWish, TeacherWishes } from '../../../types/teacher';
import { emptyWishes } from '../../../types/teacher';
import { useAppSelector } from '../../../store/hooks';
import { DAYS } from '../../../constants/days';
import styles from './TeacherViewModal.module.scss';

interface Props {
  teacher: Teacher;
  onClose: () => void;
  onUpdate: (t: Teacher) => void;
  onDelete: (id: string) => void;
}

type Mode = 'view' | 'edit' | 'confirm-delete';

// ─── DayOfWeek → dayId ───────────────────────────────────────────────────────
// Бэк: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const DOW_TO_DAY_ID: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

function mapPreferencesToWishes(dto: TeacherPreferencesViewDto): TeacherWishes {
  const wishes = emptyWishes();
  wishes.comment = dto.comment ?? '';

  for (const ta of dto.teacherTimePreferences ?? []) {
    const dayId = DOW_TO_DAY_ID[ta.dayOfWeekTimeInterval.dayOfWeek] ?? 'mon';
    const timeStart = ta.dayOfWeekTimeInterval.timeInterval.timeFrom.slice(0, 5);
    const timeEnd = ta.dayOfWeekTimeInterval.timeInterval.timeTo.slice(0, 5);
    const wish: TimeWish = { id: crypto.randomUUID(), dayId, timeStart, timeEnd };

    if (ta.teacherPreferenceType === 'Preferred') wishes.preferredTimes.push(wish);
    else if (ta.teacherPreferenceType === 'Restricted') wishes.forbiddenTimes.push(wish);
    else wishes.undesirableTimes.push(wish); // Flexible
  }

  for (const rp of dto.teacherRoomPreferences ?? []) {
    const wish: AudienceWish = {
      id: crypto.randomUUID(),
      roomId: rp.roomId,
      roomName: rp.roomId, // roomId как fallback — нет доступа к деталям аудитории здесь
    };
    if (rp.teacherPreferenceType === 'Preferred') wishes.preferredAudiences.push(wish);
    else if (rp.teacherPreferenceType === 'Restricted') wishes.forbiddenAudiences.push(wish);
    else wishes.undesirableAudiences.push(wish);
  }

  return wishes;
}

const BUILDING_LABELS: Record<string, string> = {
  turgeneva: 'Тургенева',
  kuybysheva: 'Куйбышева',
  online: 'Онлайн',
  other: 'Другой',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const TeacherViewModal: React.FC<Props> = ({
  teacher,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [mode, setMode] = useState<Mode>('view');
  const [wishes, setWishes] = useState<TeacherWishes>(teacher.wishes);
  const [wishesLoading, setWishesLoading] = useState(false);

  const selectedScheduleId = useAppSelector((s) => s.schedule.selectedScheduleId);

  // Загружаем пожелания при открытии, если есть scheduleId
  useEffect(() => {
    if (!selectedScheduleId) return;
    setWishesLoading(true);
    teacherPreferenceApi
      .getTeacherPreferences({ teacherId: teacher.id, scheduleId: selectedScheduleId })
      .then(({ data }) => setWishes(mapPreferencesToWishes(data)))
      .catch(() => { /* если нет пожеланий — оставляем пустые */ })
      .finally(() => setWishesLoading(false));
  }, [teacher.id, selectedScheduleId]);

  // ── Редактирование ────────────────────────────────────────────────────────

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

  // ── Подтверждение удаления ────────────────────────────────────────────────

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

  // ── Просмотр ──────────────────────────────────────────────────────────────

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
        {teacher.contacts && (
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Контакты</h4>
            <p className={styles.comment}>{teacher.contacts}</p>
          </section>
        )}

        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Пожелания</h4>
          {wishesLoading ? (
            <p className={styles.noWishes}>Загрузка...</p>
          ) : !hasAnyWish ? (
            <p className={styles.noWishes}>Пожелания не указаны</p>
          ) : (
            <div className={styles.wishGroups}>
              <TimeWishGroup label="Желаемое время"       variant="preferred"    items={wishes.preferredTimes} />
              <TimeWishGroup label="Нежелательное время"  variant="undesirable"  items={wishes.undesirableTimes} />
              <TimeWishGroup label="Запрещённое время"    variant="forbidden"    items={wishes.forbiddenTimes} />
              <AudienceWishGroup label="Желаемые аудитории"       variant="preferred"   items={wishes.preferredAudiences} />
              <AudienceWishGroup label="Нежелательные аудитории"  variant="undesirable" items={wishes.undesirableAudiences} />
              <AudienceWishGroup label="Запрещённые аудитории"    variant="forbidden"   items={wishes.forbiddenAudiences} />
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

const TimeWishGroup: React.FC<{ label: string; variant: WishVariant; items: TimeWish[] }> = ({
  label, variant, items,
}) => {
  if (items.length === 0) return null;
  return (
    <div className={styles.wishGroup}>
      <span className={`${styles.wishGroupLabel} ${styles[variant]}`}>{label}</span>
      <ul className={styles.wishList}>
        {items.map((item) => {
          const day = DAYS.find((d) => d.id === item.dayId)?.name ?? item.dayId;
          return <li key={item.id}>{day}, {item.timeStart}–{item.timeEnd}</li>;
        })}
      </ul>
    </div>
  );
};

const AudienceWishGroup: React.FC<{ label: string; variant: WishVariant; items: AudienceWish[] }> = ({
  label, variant, items,
}) => {
  if (items.length === 0) return null;
  return (
    <div className={styles.wishGroup}>
      <span className={`${styles.wishGroupLabel} ${styles[variant]}`}>{label}</span>
      <ul className={styles.wishList}>
        {items.map((item) => {
          const building =
            item.building === 'other'
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
