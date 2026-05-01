import React, { useState } from 'react';
import { FormField } from '../../../components/FormField/FormField';
import { Button } from '../../../components/Button/Button';
import type { SaveScheduleDto, ScheduleRegistryItemDto } from '../../../api';
import styles from './ScheduleForm.module.scss';

interface Props {
  initial?: ScheduleRegistryItemDto;
  onSave: (dto: SaveScheduleDto) => void;
  onCancel?: () => void;
}

function parseDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return digits;
}

function displayToApi(display: string): string {
  // DD.MM.YYYY → YYYY-MM-DD
  const [d, m, y] = display.split('.');
  return `${y}-${m}-${d}`;
}

function apiToDisplay(apiDate: string): string {
  // YYYY-MM-DD → DD.MM.YYYY
  const [y, m, d] = apiDate.split('-');
  return `${d}.${m}.${y}`;
}

export const ScheduleForm: React.FC<Props> = ({ initial, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [dateFrom, setDateFrom] = useState(initial ? apiToDisplay(initial.dateInterval.dateFrom) : '');
  const [dateTo, setDateTo] = useState(initial ? apiToDisplay(initial.dateInterval.dateTo) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Обязательное поле';
    if (dateFrom.length < 10) errs.dateFrom = 'Введите полную дату (ДД.ММ.ГГГГ)';
    if (dateTo.length < 10) errs.dateTo = 'Введите полную дату (ДД.ММ.ГГГГ)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: initial?.id ?? undefined,
      name: name.trim(),
      dateInterval: { dateFrom: displayToApi(dateFrom), dateTo: displayToApi(dateTo) },
    });
  };

  const handleReset = () => {
    setName('');
    setDateFrom('');
    setDateTo('');
    setErrors({});
    setShowResetConfirm(false);
  };

  return (
    <div className={styles.form}>
      <FormField label="Название расписания" required error={errors.name}>
        <input
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Расписание 1 семестра 2025"
          autoFocus
        />
      </FormField>

      <div className={styles.row2}>
        <FormField label="Начало семестра" required error={errors.dateFrom}>
          <input
            className="field-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(parseDateInput(e.target.value))}
            placeholder="01.09.2025"
            maxLength={10}
          />
        </FormField>
        <FormField label="Конец семестра" required error={errors.dateTo}>
          <input
            className="field-input"
            value={dateTo}
            onChange={(e) => setDateTo(parseDateInput(e.target.value))}
            placeholder="31.12.2025"
            maxLength={10}
          />
        </FormField>
      </div>

      <div className={styles.actions}>
        {showResetConfirm ? (
          <div className={styles.resetConfirm}>
            <span>Сбросить все поля?</span>
            <Button size="sm" variant="danger" onClick={handleReset}>Да, сбросить</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowResetConfirm(false)}>Отмена</Button>
          </div>
        ) : (
          <>
            {onCancel
              ? <Button variant="secondary" onClick={onCancel}>Отмена</Button>
              : <Button variant="secondary" onClick={() => setShowResetConfirm(true)}>Сбросить</Button>
            }
            <Button variant="primary" onClick={handleSave}>
              {initial ? 'Сохранить' : 'Создать'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
