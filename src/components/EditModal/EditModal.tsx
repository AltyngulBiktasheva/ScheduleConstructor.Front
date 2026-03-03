import React, { useState } from 'react';
import type { Discipline, GridSlot } from '../../types';
import { DAYS } from '../../constants/days';
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

    const handleSave = () => {
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

        if (formData.isInGrid) {
            if (!formData.timeStart || !formData.timeEnd) {
                setError('Для дисциплины в сетке время проведения обязательно');
                return;
            }

            if (!formData.dayId) {
                setError('День недели обязателен');
                return;
            }

            // Проверка на занятость слота
            const isSlotOccupied = slots.some(slot =>
                slot.dayId === formData.dayId &&
                slot.timeSlotId === formData.slotId &&
                slot.disciplineId &&
                slot.disciplineId !== formData.id
            );

            if (isSlotOccupied) {
                setError('Данное время уже занято другой дисциплиной');
                return;
            }
        }

        onSave(formData);
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

                    {formData.isInGrid && (
                        <>
                            <div className={styles.field}>
                                <label>День недели *</label>
                                <select
                                    value={formData.dayId || ''}
                                    onChange={(e) => setFormData({ ...formData, dayId: e.target.value })}
                                >
                                    <option value="">Выберите день</option>
                                    {DAYS.map(day => (
                                        <option key={day.id} value={day.id}>{day.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label>Время проведения *</label>
                                <div className={styles.timeRange}>
                                    <input
                                        type="text"
                                        placeholder="__:__"
                                        value={formData.timeStart || ''}
                                        onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
                                    />
                                    <span>-</span>
                                    <input
                                        type="text"
                                        placeholder="__:__"
                                        value={formData.timeEnd || ''}
                                        onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
                                    />
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