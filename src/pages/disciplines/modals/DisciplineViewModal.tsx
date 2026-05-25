import React, { useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button/Button';
import { Badge } from '../../../components/Badge/Badge';
import { DisciplineForm } from '../tabs/DisciplineForm';
import { RootDisciplineForm } from '../tabs/RootDisciplineForm';
import type { RootDisciplineFormData } from '../tabs/RootDisciplineForm';
import { LESSON_TYPE_LABELS } from '../tabs/RootDisciplineForm';
import type { Discipline } from '../../../types';
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

  // ── Редактирование ─────────────────────────────────────────────────────────

  if (mode === 'edit') {
    if (discipline.isRoot) {
      const handleRootSave = (data: RootDisciplineFormData) => {
        onUpdate({
          ...discipline,
          name: data.name,
          allowedLessonTypes: data.allowedLessonTypes,
          semesterNumber: data.semesterNumber,
          associatedNames: data.associatedNames,
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
              associatedNames: discipline.associatedNames ?? [],
            }}
            onSave={handleRootSave}
            onCancel={() => setMode('view')}
          />
        </Modal>
      );
    }

    if (discipline.childBatches) {
      // Редактирование всего batch-а: первый batch = initial, остальные = _extraBatches
      const firstBatch = discipline.childBatches[0];
      const initialForForm: Discipline = {
        ...firstBatch,
        _extraBatches: discipline.childBatches.slice(1),
      };
      return (
        <Modal title="Редактирование дисциплины" onClose={onClose} width={640}>
          <DisciplineForm
            initial={initialForForm}
            onSave={(updated) => { onUpdate(updated); setMode('view'); }}
            onCancel={() => setMode('view')}
          />
        </Modal>
      );
    }

    const isSingleBatchEdit = discipline.batchIndex != null && !!discipline.lessonId;
    return (
      <Modal title="Редактирование дисциплины" onClose={onClose} width={640}>
        <DisciplineForm
          initial={discipline}
          singleBatch={isSingleBatchEdit}
          onSave={(updated) => {
            const withFlag = isSingleBatchEdit ? { ...updated, _singleBatchEdit: true } : updated;
            onUpdate(withFlag);
            setMode('view');
          }}
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
      {(discipline.associatedNames ?? []).length > 0 && (
        <Row label="Другие названия">
          <div className={styles.associatedNames}>
            {(discipline.associatedNames ?? []).map((n, i) => (
              <span key={i} className={styles.associatedName}>{n}</span>
            ))}
          </div>
        </Row>
      )}
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Собирает уникальные значения для сводки по нескольким batch-ям */
function mergeSummaryDisplay(values: (string | number | undefined | null)[]): string {
  const unique = [...new Set(values.filter((v) => v != null).map(String))];
  return unique.join(', ') || '—';
}

// ─── Child view ───────────────────────────────────────────────────────────────

const ChildView: React.FC<{ discipline: Discipline }> = ({ discipline }) => {
  const batches = discipline.childBatches;

  return (
    <div className={styles.view}>
      <Section title="Основное">
        {discipline.lessonType && (
          <Row label="Вид занятия">
            <Badge variant="purple">{LESSON_TYPE_LABELS[discipline.lessonType] ?? discipline.lessonType}</Badge>
          </Row>
        )}
        {batches ? (
          // Сводная информация по нескольким batch-ям
          <>
            <Row label="Занятий">{batches.length}</Row>
            <Row label="Количество часов">
              {mergeSummaryDisplay(batches.map((b) => b.totalHoursCount))}
            </Row>
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
              <Row label="Группы">{(discipline.forNames ?? []).filter(Boolean).join(', ') || '—'}</Row>
            )}
            {/* Преподаватели (уникальные по всем batch-ам) */}
            {(() => {
              const names = [...new Set(batches.flatMap((b) => b.teachers.map((t) => t.name).filter(Boolean)))];
              return names.length > 0 ? <Row label="Преподаватели">{names.join(', ')}</Row> : null;
            })()}
            {/* Аудитории (уникальные по всем batch-ам) */}
            {(() => {
              const rooms = [...new Set(batches.flatMap((b) => b.audiences.map((a) => a.roomName).filter(Boolean)))];
              return rooms.length > 0 ? <Row label="Аудитории">{rooms.join(', ')}</Row> : null;
            })()}
            {/* Время (уникальные по всем batch-ам) */}
            {(() => {
              const occs = batches.flatMap((b) => b.occurrences ?? []);
              if (occs.length === 0) return null;
              return (
                <Row label="Время проведения">
                  {occs.map((o, i) => (
                    <span key={i}>
                      {DAYS.find((d) => d.id === o.dayId)?.shortName ?? o.dayId}{' '}
                      {o.timeStart}–{o.timeEnd}
                      {i < occs.length - 1 ? '; ' : ''}
                    </span>
                  ))}
                </Row>
              );
            })()}
          </>
        ) : (
          // Одно занятие
          <>
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
              <Row label="Группа">{(discipline.forNames ?? []).filter(Boolean).join(', ') || '—'}</Row>
            )}
            {/* Преподаватели */}
            {discipline.teachers.length > 0 && (
              <Row label="Преподаватели">{discipline.teachers.map((t) => t.name).filter(Boolean).join(', ')}</Row>
            )}
            {/* Аудитории */}
            {discipline.audiences.length > 0 && (
              <Row label="Аудитории">{discipline.audiences.map((a) => a.roomName).filter(Boolean).join(', ')}</Row>
            )}
            {/* Время проведения */}
            {(discipline.occurrences ?? []).length > 0 && (
              <Row label="Время проведения">
                {discipline.occurrences!.map((o, i) => (
                  <span key={i}>
                    {DAYS.find((d) => d.id === o.dayId)?.shortName ?? o.dayId}{' '}
                    {o.timeStart}–{o.timeEnd}
                    {i < discipline.occurrences!.length - 1 ? '; ' : ''}
                  </span>
                ))}
              </Row>
            )}
            {discipline.dateRange && (
              <Row label="Период">
                {discipline.dateRange.from} — {discipline.dateRange.to}
              </Row>
            )}
          </>
        )}
      </Section>
      {discipline.comment && (
        <Section title="Комментарий">
          <p className={styles.comment}>{discipline.comment}</p>
        </Section>
      )}
    </div>
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
