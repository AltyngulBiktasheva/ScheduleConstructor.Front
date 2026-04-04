import React, { useEffect, useState } from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { FormField } from '../FormField/FormField';
import { useSchedule } from '../../store/slices/scheduleSlice';
import styles from './ScheduleSelector.module.scss';

// ─── Create Schedule Modal ────────────────────────────────────────────────────

interface CreateScheduleModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({ onClose, onCreated }) => {
  const { save, saving } = useSchedule();

  const [name, setName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isEvenStart, setIsEvenStart] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDateInput = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 4) return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
    if (digits.length > 2) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    return digits;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Обязательное поле';
    if (!dateFrom) errs.dateFrom = 'Обязательное поле';
    if (!dateTo) errs.dateTo = 'Обязательное поле';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    // Дата начала/конца и чётность пока хранятся только на фронте;
    // на бэк уходит только название расписания.
    await save({ name: name.trim() });
    onCreated();
    onClose();
  };

  return (
    <Modal
      title="Создать проект расписания"
      onClose={onClose}
      width={520}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Создание…' : 'Создать'}
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
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
              onChange={(e) => setDateFrom(handleDateInput(e.target.value))}
              placeholder="01.09.2025"
              maxLength={10}
            />
          </FormField>
          <FormField label="Конец семестра" required error={errors.dateTo}>
            <input
              className="field-input"
              value={dateTo}
              onChange={(e) => setDateTo(handleDateInput(e.target.value))}
              placeholder="31.12.2025"
              maxLength={10}
            />
          </FormField>
        </div>

        <FormField label="Начало семестра" hint="Первая неделя семестра">
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                checked={isEvenStart}
                onChange={() => setIsEvenStart(true)}
              />
              Чётная неделя
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                checked={!isEvenStart}
                onChange={() => setIsEvenStart(false)}
              />
              Нечётная неделя
            </label>
          </div>
        </FormField>
      </div>
    </Modal>
  );
};

// ─── ScheduleSelector ─────────────────────────────────────────────────────────

export const ScheduleSelector: React.FC = () => {
  const { list, selectedScheduleId, fetchAll, selectSchedule } = useSchedule();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectSchedule(e.target.value || null);
  };

  const handleCreated = () => {
    fetchAll();
  };

  return (
    <>
      <div className={styles.wrapper}>
        <span className={styles.label}>Проект расписания:</span>
        <select
          className={styles.select}
          value={selectedScheduleId ?? ''}
          onChange={handleChange}
        >
          <option value="">— не выбран —</option>
          {list.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
          + Создать расписание
        </button>
      </div>

      {showCreate && (
        <CreateScheduleModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
};
