import React, { useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { AcademicDisciplineType } from '../../../api';
import styles from './RootDisciplineForm.module.scss';

// ─── Константы ───────────────────────────────────────────────────────────────

export const LESSON_TYPE_LABELS: Record<AcademicDisciplineType, string> = {
  Lecture: 'Лекция',
  Practice: 'Практика',
  Lab: 'Лабораторная',
  Exam: 'Экзамен',
  Test: 'Зачёт',
};

const ALL_TYPES: AcademicDisciplineType[] = ['Lecture', 'Practice', 'Lab', 'Exam', 'Test'];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RootDisciplineFormData {
  name: string;
  semesterNumber: number;
  allowedLessonTypes: AcademicDisciplineType[];
}

interface Props {
  initial?: RootDisciplineFormData;
  onSave: (data: RootDisciplineFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const RootDisciplineForm: React.FC<Props> = ({ initial, onSave, onCancel, loading }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [allowedLessonTypes, setAllowedLessonTypes] = useState<AcademicDisciplineType[]>(initial?.allowedLessonTypes ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleType = (type: AcademicDisciplineType) => {
    setAllowedLessonTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Обязательное поле';
    if (allowedLessonTypes.length === 0) errs.types = 'Выберите хотя бы один тип занятий';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      semesterNumber: 1,
      allowedLessonTypes,
    });
  };

  return (
    <div className={styles.form}>
      <p className={styles.hint}>
        Корневая дисциплина — это шаблон, объединяющий несколько видов занятий (лекции, практики и т.д.).
        На её основе создаются отдельные записи расписания.
      </p>

      {/* Название */}
      <FormField label="Название дисциплины" required error={errors.name}>
        <input
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Математический анализ"
          autoFocus
        />
      </FormField>

      {/* Типы занятий */}
      <FormField
        label="Допустимые виды занятий"
        required
        error={errors.types}
        hint="Отметьте все виды занятий, которые проводятся по этой дисциплине"
      >
        <div className={styles.checkList}>
          {ALL_TYPES.map((type) => (
            <label key={type} className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={allowedLessonTypes.includes(type)}
                onChange={() => toggleType(type)}
              />
              {LESSON_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </FormField>

      {/* Кнопки */}
      <div className={styles.actions}>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Отмена</Button>
        )}
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Сохранение...' : (initial ? 'Сохранить' : 'Создать корневую дисциплину')}
        </Button>
      </div>
    </div>
  );
};
