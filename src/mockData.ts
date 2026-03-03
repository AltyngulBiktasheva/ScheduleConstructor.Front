import type { Discipline, GridSlot } from './types';

export const MOCK_DISCIPLINES: Discipline[] = [
    {
        id: '1',
        name: 'Математический анализ',
        teacher: 'Иванов И.И.',
        building: 'turgeneva',
        audience: '301',
        repeat: 'every-week',
        isInGrid: false
    },
    {
        id: '2',
        name: 'Физика',
        teacher: 'Петров П.П.',
        building: 'kuybysheva',
        audience: '205',
        repeat: 'every-week',
        isInGrid: false
    },
    {
        id: '3',
        name: 'Программирование',
        teacher: 'Сидоров С.С.',
        building: 'online',
        repeat: 'every-week',
        isInGrid: false
    },
    {
        id: '4',
        name: 'Английский язык',
        teacher: 'Смирнова А.А.',
        building: 'turgeneva',
        audience: '410',
        repeat: 'every-week',
        isInGrid: false
    },
    {
        id: '5',
        name: 'История',
        teacher: 'Козлов В.В.',
        building: 'kuybysheva',
        audience: '101',
        repeat: 'every-week',
        isInGrid: false
    }
];

export const MOCK_SLOTS: GridSlot[] = [
    // Понедельник
    { id: 'mon-1', timeSlotId: '1', dayId: 'mon', color: 'green' },
    { id: 'mon-2', timeSlotId: '2', dayId: 'mon', color: 'green' },
    { id: 'mon-3', timeSlotId: '3', dayId: 'mon', color: 'yellow', warning: { type: 'yellow', message: 'Преподаватель отметил данный слот как нежелательный' } },
    { id: 'mon-4', timeSlotId: '4', dayId: 'mon', color: 'green' },
    { id: 'mon-5', timeSlotId: '5', dayId: 'mon', color: 'red', warning: { type: 'red', message: 'Пересекаются аудитории' } },
    { id: 'mon-6', timeSlotId: '6', dayId: 'mon', color: 'green' },
    { id: 'mon-7', timeSlotId: '7', dayId: 'mon', color: 'green' },
    { id: 'mon-8', timeSlotId: '8', dayId: 'mon', color: 'green' },

    // Вторник
    { id: 'tue-1', timeSlotId: '1', dayId: 'tue', color: 'green' },
    { id: 'tue-2', timeSlotId: '2', dayId: 'tue', color: 'green' },
    { id: 'tue-3', timeSlotId: '3', dayId: 'tue', color: 'green' },
    { id: 'tue-4', timeSlotId: '4', dayId: 'tue', color: 'yellow', warning: { type: 'yellow', message: 'Преподаватель отметил данный слот как нежелательный' } },
    { id: 'tue-5', timeSlotId: '5', dayId: 'tue', color: 'green' },
    { id: 'tue-6', timeSlotId: '6', dayId: 'tue', color: 'green' },
    { id: 'tue-7', timeSlotId: '7', dayId: 'tue', color: 'red', warning: { type: 'red', message: 'Пересекаются аудитории' } },
    { id: 'tue-8', timeSlotId: '8', dayId: 'tue', color: 'green' },

    // Среда
    { id: 'wed-1', timeSlotId: '1', dayId: 'wed', color: 'green' },
    { id: 'wed-2', timeSlotId: '2', dayId: 'wed', color: 'red', warning: { type: 'red', message: 'Аудитория занята' } },
    { id: 'wed-3', timeSlotId: '3', dayId: 'wed', color: 'green' },
    { id: 'wed-4', timeSlotId: '4', dayId: 'wed', color: 'green' },
    { id: 'wed-5', timeSlotId: '5', dayId: 'wed', color: 'green' },
    { id: 'wed-6', timeSlotId: '6', dayId: 'wed', color: 'yellow', warning: { type: 'yellow', message: 'Преподаватель отметил данный слот как нежелательный' } },
    { id: 'wed-7', timeSlotId: '7', dayId: 'wed', color: 'green' },
    { id: 'wed-8', timeSlotId: '8', dayId: 'wed', color: 'green' },

    // Четверг
    { id: 'thu-1', timeSlotId: '1', dayId: 'thu', color: 'green' },
    { id: 'thu-2', timeSlotId: '2', dayId: 'thu', color: 'green' },
    { id: 'thu-3', timeSlotId: '3', dayId: 'thu', color: 'green' },
    { id: 'thu-4', timeSlotId: '4', dayId: 'thu', color: 'green' },
    { id: 'thu-5', timeSlotId: '5', dayId: 'thu', color: 'red', warning: { type: 'red', message: 'Пересекаются аудитории' } },
    { id: 'thu-6', timeSlotId: '6', dayId: 'thu', color: 'green' },
    { id: 'thu-7', timeSlotId: '7', dayId: 'thu', color: 'green' },
    { id: 'thu-8', timeSlotId: '8', dayId: 'thu', color: 'green' },

    // Пятница
    { id: 'fri-1', timeSlotId: '1', dayId: 'fri', color: 'yellow', warning: { type: 'yellow', message: 'Преподаватель отметил данный слот как нежелательный' } },
    { id: 'fri-2', timeSlotId: '2', dayId: 'fri', color: 'green' },
    { id: 'fri-3', timeSlotId: '3', dayId: 'fri', color: 'green' },
    { id: 'fri-4', timeSlotId: '4', dayId: 'fri', color: 'green' },
    { id: 'fri-5', timeSlotId: '5', dayId: 'fri', color: 'green' },
    { id: 'fri-6', timeSlotId: '6', dayId: 'fri', color: 'green' },
    { id: 'fri-7', timeSlotId: '7', dayId: 'fri', color: 'red', warning: { type: 'red', message: 'Аудитория занята' } },
    { id: 'fri-8', timeSlotId: '8', dayId: 'fri', color: 'green' },

    // Суббота
    { id: 'sat-1', timeSlotId: '1', dayId: 'sat', color: 'green' },
    { id: 'sat-2', timeSlotId: '2', dayId: 'sat', color: 'green' },
    { id: 'sat-3', timeSlotId: '3', dayId: 'sat', color: 'green' },
    { id: 'sat-4', timeSlotId: '4', dayId: 'sat', color: 'yellow', warning: { type: 'yellow', message: 'Преподаватель отметил данный слот как нежелательный' } },
    { id: 'sat-5', timeSlotId: '5', dayId: 'sat', color: 'green' },
    { id: 'sat-6', timeSlotId: '6', dayId: 'sat', color: 'green' },
    { id: 'sat-7', timeSlotId: '7', dayId: 'sat', color: 'green' },
    { id: 'sat-8', timeSlotId: '8', dayId: 'sat', color: 'red', warning: { type: 'red', message: 'Пересекаются аудитории' } },
];