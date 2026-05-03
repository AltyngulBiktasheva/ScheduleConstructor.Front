import React from 'react';
import { Button } from '../../components/Button/Button';
import type { TeacherWishes, TimeWish, AudienceWish } from '../../types';
import { DAYS } from '../../constants/days';
import styles from './WishesViewer.module.scss';

interface Props {
  wishes: TeacherWishes;
  onEdit: () => void;
}


export const WishesViewer: React.FC<Props> = ({ wishes, onEdit }) => {
  const hasStaticWishes =
    wishes.preferredTimes.length > 0 ||
    wishes.undesirableTimes.length > 0 ||
    wishes.forbiddenTimes.length > 0 ||
    wishes.preferredAudiences.length > 0 ||
    wishes.undesirableAudiences.length > 0 ||
    wishes.forbiddenAudiences.length > 0;

  const hasComment = wishes.comment.trim().length > 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <h2 className={styles.sectionTitle}>Пожелания к расписанию</h2>
        <Button variant="primary" size="sm" onClick={onEdit}>
          Редактировать пожелания
        </Button>
      </div>

      {!hasStaticWishes && !hasComment ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📭</span>
          <p>Пожелания пока не указаны</p>
          <Button variant="ghost" onClick={onEdit}>Добавить пожелания</Button>
        </div>
      ) : (
        <div className={styles.sections}>
          {/* Статичные пожелания */}
          {hasStaticWishes && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Статичные пожелания</h3>
              <p className={styles.cardHint}>
                Учитываются автоматически при составлении расписания
              </p>

              <div className={styles.wishGrid}>
                <TimeWishSection
                  label="Желаемое время"
                  variant="preferred"
                  items={wishes.preferredTimes}
                />
                <TimeWishSection
                  label="Нежелательное время"
                  variant="undesirable"
                  items={wishes.undesirableTimes}
                />
                <TimeWishSection
                  label="Запрещённое время"
                  variant="forbidden"
                  items={wishes.forbiddenTimes}
                />
                <AudienceWishSection
                  label="Желаемые аудитории"
                  variant="preferred"
                  items={wishes.preferredAudiences}
                />
                <AudienceWishSection
                  label="Нежелательные аудитории"
                  variant="undesirable"
                  items={wishes.undesirableAudiences}
                />
                <AudienceWishSection
                  label="Запрещённые аудитории"
                  variant="forbidden"
                  items={wishes.forbiddenAudiences}
                />
              </div>
            </div>
          )}

          {/* Нестатичные пожелания */}
          {hasComment && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Дополнительные пожелания</h3>
              <p className={styles.cardHint}>
                Рассматриваются составителями расписания вручную
              </p>
              <p className={styles.comment}>{wishes.comment}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

type Variant = 'preferred' | 'undesirable' | 'forbidden';

// const VARIANT_CONFIG: Record<Variant, { label: string; className: string }> = {
//   preferred:   { label: 'Желаемое',    className: 'preferred' },
//   undesirable: { label: 'Нежелательное', className: 'undesirable' },
//   forbidden:   { label: 'Запрещённое', className: 'forbidden' },
// };

const TimeWishSection: React.FC<{
  label: string;
  variant: Variant;
  items: TimeWish[];
}> = ({ label, variant, items }) => {
  if (items.length === 0) return null;
  return (
    <div className={styles.wishSection}>
      <span className={`${styles.wishLabel} ${styles[variant]}`}>{label}</span>
      <ul className={styles.wishItems}>
        {items.map((item) => {
          const day = DAYS.find((d) => d.id === item.dayId)?.name ?? item.dayId;
          return <li key={item.id}>{day}, {item.timeStart}–{item.timeEnd}</li>;
        })}
      </ul>
    </div>
  );
};

const AudienceWishSection: React.FC<{
  label: string;
  variant: Variant;
  items: AudienceWish[];
}> = ({ label, variant, items }) => {
  if (items.length === 0) return null;
  return (
    <div className={styles.wishSection}>
      <span className={`${styles.wishLabel} ${styles[variant]}`}>{label}</span>
      <ul className={styles.wishItems}>
        {items.map((item) => (
          <li key={item.id}>{item.roomName || item.roomId}</li>
        ))}
      </ul>
    </div>
  );
};
