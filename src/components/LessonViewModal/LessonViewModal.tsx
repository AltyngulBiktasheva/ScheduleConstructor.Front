import React from 'react';
import { Modal } from '../Modal/Modal';
import type { Discipline } from '../../types';
import { LESSON_TYPE_LABELS } from '../../pages/disciplines/tabs/RootDisciplineForm';
import type { AcademicDisciplineType } from '../../api';
import styles from './LessonViewModal.module.scss';

interface Props {
  discipline: Discipline;
  onClose: () => void;
}

export const LessonViewModal: React.FC<Props> = ({ discipline, onClose }) => {
  const typeLabel = discipline.lessonType
    ? LESSON_TYPE_LABELS[discipline.lessonType as AcademicDisciplineType]
    : null;

  const teacherLabel = discipline.teachers
    ?.map((t) => t.name)
    .filter(Boolean)
    .join(', ');

  const audienceLabel = discipline.audiences
    ?.map((a) => {
      const room = a.roomName ?? '';
      return room;
    })
    .filter(Boolean)
    .join(', ');

  const groupLabel = (discipline.forNames ?? []).filter(Boolean).join(', ');

  const timeLabel =
    discipline.timeStart && discipline.timeEnd
      ? `${discipline.timeStart} – ${discipline.timeEnd}`
      : null;

  return (
    <Modal title={discipline.name} onClose={onClose} width={500}>
      <div className={styles.view}>
        {typeLabel && <Row label="Тип занятия">{typeLabel}</Row>}
        {timeLabel && <Row label="Время">{timeLabel}</Row>}
        <Row label="Преподаватели">
          {teacherLabel || <span className={styles.none}>Не назначены</span>}
        </Row>
        <Row label="Аудитории">
          {audienceLabel || <span className={styles.none}>Не назначены</span>}
        </Row>
        <Row label="Группы">
          {groupLabel || <span className={styles.none}>Не назначены</span>}
        </Row>
        {discipline.comment && (
          <Row label="Комментарий">{discipline.comment}</Row>
        )}
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
