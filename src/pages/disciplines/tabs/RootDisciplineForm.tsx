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
  cypher: string;
  semesterNumber: number;
  allowedLessonTypes: AcademicDisciplineType[];
}

interface Props {
  onSave: (data: RootDisciplineFormData) => void;
  onCancel?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const RootDisciplineForm: React.FC<Props> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [cypher, setCypher] = useState('');
  const [semesterNumber, setSemesterNumber] = useState(1);
  const [allowedLessonTypes, setAllowedLessonTypes] = useState<AcademicDisciplineType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleType = (type: AcademicDisciplineType) => {
    setAllowedLessonTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Обязательное поле';
    if (!cypher.trim()) errs.cypher = 'Обязательное поле';
    if (allowedLessonTypes.length === 0) errs.types = 'Выберите хотя бы один тип занятий';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      cypher: cypher.trim(),
      semesterNumber,
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

      <div className={styles.row2}>
        {/* Шифр / направление */}
        <FormField label="Направление обучения (шифр)" required error={errors.cypher}>
          <input
            className="field-input"
            value={cypher}
            onChange={(e) => setCypher(e.target.value)}
            placeholder="09.03.03"
          />
        </FormField>

        {/* Семестр */}
        <FormField label="Семестр" required>
          <input
            className="field-input"
            type="number"
            min={1}
            max={12}
            value={semesterNumber}
            onChange={(e) => setSemesterNumber(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
            style={{ width: 120 }}
          />
        </FormField>
      </div>

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
          <Button variant="secondary" onClick={onCancel}>Отмена</Button>
        )}
        <Button variant="primary" onClick={handleSave}>Создать корневую дисциплину</Button>
      </div>
    </div>
  );
};
