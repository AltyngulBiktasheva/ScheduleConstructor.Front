import React, { useState } from 'react';
import type { Discipline, GridSlot } from '../../types';
import { DAYS } from '../../constants/days';
import { TIME_SLOTS } from '../../constants/timeSlots';
import { BUILDING_OPTIONS, type BuildingType } from '../../constants/buildings';
import styles from './Styles.module.scss';

interface Props {
    discipline: Discipline;
    onSave: (discipline: Discipline) => void;
    onClose: () => void;
    slots: GridSlot[];
}

export const EditModal: React.FC<Props> = ({ discipline, onSave, onClose, slots }) => {
    const [formData, setFormData] = useState<Discipline>({ ...discipline });
    const [error, setError] = useState<string>('');

    const handleBuildingChange = (building: BuildingType) => {
        setFormData({
            ...formData,
            building,
            buildingName: building === 'other' ? '' : undefined,
            audience: building === 'online' ? undefined : formData.audience
        });
    };

    const findFreeSlotByTime = (timeStart: string, timeEnd: string): { slotId: string, dayId: string } | null => {
        // Ищем временной слот, соответствующий указанному времени
        const targetTimeSlot = TIME_SLOTS.find(slot =>
            slot.start === timeStart && slot.end === timeEnd
        );

        if (!targetTimeSlot) return null;

        // Проверяем каждый день недели по порядку
        for (const day of DAYS) {
            const slot = slots.find(s =>
                s.timeSlotId === targetTimeSlot.id &&
                s.dayId === day.id
            );

            // Если слот существует, не занят и не красный
            if (slot && !slot.disciplineId && slot.color !== 'red') {
                return { slotId: slot.id, dayId: slot.dayId };
            }
        }

        return null;
    };

    const findFreeSlotByDay = (dayId: string): { slotId: string, timeStart: string, timeEnd: string } | null => {
        // Проверяем каждый временной слот по порядку
        for (const timeSlot of TIME_SLOTS) {
            const slot = slots.find(s =>
                s.timeSlotId === timeSlot.id &&
                s.dayId === dayId
            );

            // Если слот существует, не занят и не красный
            if (slot && !slot.disciplineId && slot.color !== 'red') {
                return {
                    slotId: slot.id,
                    timeStart: timeSlot.start,
                    timeEnd: timeSlot.end
                };
            }
        }

        return null;
    };

    const checkSlotAvailability = (dayId: string, timeStart: string, timeEnd: string): { available: boolean, reason?: string } => {
        const targetTimeSlot = TIME_SLOTS.find(slot =>
            slot.start === timeStart && slot.end === timeEnd
        );

        if (!targetTimeSlot) {
            return { available: false, reason: 'Указано некорректное время' };
        }

        const targetSlot = slots.find(s =>
            s.timeSlotId === targetTimeSlot.id &&
            s.dayId === dayId
        );

        if (!targetSlot) {
            return { available: false, reason: 'Слот не найден' };
        }

        if (targetSlot.color === 'red') {
            return { available: false, reason: 'Нельзя разместить дисциплину в красном слоте' };
        }

        if (targetSlot.disciplineId && targetSlot.disciplineId !== formData.id) {
            return { available: false, reason: 'Данное время уже занято другой дисциплиной' };
        }

        return { available: true };
    };

    const handleSave = () => {
        // Валидация обязательных полей
        if (!formData.name) {
            setError('Название дисциплины обязательно');
            return;
        }

        if (!formData.teacher) {
            setError('Преподаватель обязателен');
            return;
        }

        if (!formData.building) {
            setError('Корпус обязателен');
            return;
        }

        if (formData.building === 'other' && !formData.buildingName) {
            setError('Название корпуса обязательно');
            return;
        }

        // Создаем копию данных для обновления
        let updatedData = { ...formData };

        // Логика для дисциплин в сетке
        if (updatedData.isInGrid) {
            // Проверяем, указаны ли день и время
            const hasDayAndTime = updatedData.dayId && updatedData.timeStart && updatedData.timeEnd;
            const hasOnlyTime = updatedData.timeStart && updatedData.timeEnd && !updatedData.dayId;
            const hasOnlyDay = updatedData.dayId && (!updatedData.timeStart || !updatedData.timeEnd);

            // Если поля не заполнены - оставляем дисциплину без изменений
            if (!hasDayAndTime && !hasOnlyTime && !hasOnlyDay) {
                // Возвращаем оригинальную дисциплину без изменений
                onSave(discipline);
                return;
            }

            // Случай 1: Указаны и день, и время
            if (hasDayAndTime) {
                const availability = checkSlotAvailability(updatedData.dayId!, updatedData.timeStart!, updatedData.timeEnd!);

                if (!availability.available) {
                    setError(availability.reason || 'Невозможно разместить дисциплину');
                    return;
                }

                // Находим ID слота
                const targetTimeSlot = TIME_SLOTS.find(slot =>
                    slot.start === updatedData.timeStart && slot.end === updatedData.timeEnd
                );
                const targetSlot = slots.find(s =>
                    s.timeSlotId === targetTimeSlot?.id &&
                    s.dayId === updatedData.dayId
                );
                updatedData.slotId = targetSlot?.id;
            }
            // Случай 2: Указано только время
            else if (hasOnlyTime) {
                const freeSlot = findFreeSlotByTime(updatedData.timeStart!, updatedData.timeEnd!);

                if (freeSlot) {
                    updatedData.dayId = freeSlot.dayId;
                    updatedData.slotId = freeSlot.slotId;
                } else {
                    setError('Нет свободных дней на указанное время');
                    return;
                }
            }
            // Случай 3: Указан только день
            else if (hasOnlyDay) {
                const freeSlot = findFreeSlotByDay(updatedData.dayId!);

                if (freeSlot) {
                    updatedData.timeStart = freeSlot.timeStart;
                    updatedData.timeEnd = freeSlot.timeEnd;
                    updatedData.slotId = freeSlot.slotId;
                } else {
                    setError('В выбранный день нет свободных слотов');
                    return;
                }
            }
        }

        onSave(updatedData);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h3 className={styles.title}>Редактирование дисциплины</h3>

                <div className={styles.form}>
                    <div className={styles.field}>
                        <label>Название дисциплины *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Преподаватель *</label>
                        <input
                            type="text"
                            value={formData.teacher || ''}
                            onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Корпус *</label>
                        <select
                            value={formData.building}
                            onChange={(e) => handleBuildingChange(e.target.value as BuildingType)}
                        >
                            {BUILDING_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.building === 'other' && (
                        <div className={styles.field}>
                            <label>Название корпуса *</label>
                            <input
                                type="text"
                                value={formData.buildingName || ''}
                                onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                            />
                        </div>
                    )}

                    {(formData.building === 'turgeneva' || formData.building === 'kuybysheva' || formData.building === 'other') && (
                        <div className={styles.field}>
                            <label>Аудитория *</label>
                            <input
                                type="text"
                                value={formData.audience || ''}
                                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                            />
                        </div>
                    )}

                    {discipline.isInGrid && (
                        <>
                            <div className={styles.field}>
                                <label>День недели</label>
                                <select
                                    value={formData.dayId || ''}
                                    onChange={(e) => setFormData({ ...formData, dayId: e.target.value || undefined })}
                                >
                                    <option value="">Не указан</option>
                                    {DAYS.map(day => (
                                        <option key={day.id} value={day.id}>{day.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label>Время проведения</label>
                                <div className={styles.timeRange}>
                                    <select
                                        value={formData.timeStart || ''}
                                        onChange={(e) => {
                                            const timeStart = e.target.value;
                                            const timeSlot = TIME_SLOTS.find(slot => slot.start === timeStart);
                                            setFormData({
                                                ...formData,
                                                timeStart: timeStart || undefined,
                                                timeEnd: timeSlot?.end || undefined
                                            });
                                        }}
                                    >
                                        <option value="">Начало</option>
                                        {TIME_SLOTS.map(slot => (
                                            <option key={slot.id} value={slot.start}>{slot.displayStart}</option>
                                        ))}
                                    </select>
                                    <span>-</span>
                                    <select
                                        value={formData.timeEnd || ''}
                                        onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value || undefined })}
                                    >
                                        <option value="">Конец</option>
                                        {TIME_SLOTS.map(slot => (
                                            <option key={slot.id} value={slot.end}>{slot.displayEnd}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>Повторение</label>
                                <select
                                    value={formData.repeat}
                                    onChange={(e) => setFormData({ ...formData, repeat: e.target.value as any })}
                                >
                                    <option value="every-week">Каждую неделю</option>
                                    <option value="once">Единожды</option>
                                    <option value="every-two-weeks">Каждые две недели</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className={styles.field}>
                        <label>Комментарий</label>
                        <textarea
                            value={formData.comment || ''}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            rows={3}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.actions}>
                        <button onClick={onClose} className={styles.cancel}>Отмена</button>
                        <button onClick={handleSave} className={styles.save}>Сохранить</button>
                    </div>
                </div>
            </div>
        </div>
    );
};