import { type Discipline } from '../types/discipline.types';
import { CellState } from './cellState.constants';

export const INITIAL_DISCIPLINES: Discipline[] = [
    {
        id: 1,
        name: 'Математика',
        code: 'МАТ-101',
        hours: 2,
        color: '#4a90e2',
        state: CellState.SUCCESS,
        description: 'Высшая математика, интегралы и производные'
    },
    {
        id: 2,
        name: 'Физика',
        code: 'ФИЗ-202',
        hours: 3,
        color: '#e24a4a',
        state: CellState.ERROR,
        description: 'Механика, термодинамика, оптика'
    },
    {
        id: 3,
        name: 'Программирование',
        code: 'ПРОГ-303',
        hours: 4,
        color: '#4ae24a',
        state: CellState.SUCCESS,
        description: 'Алгоритмы и структуры данных'
    },
    {
        id: 4,
        name: 'Английский язык',
        code: 'АНГ-101',
        hours: 1,
        color: '#e2b04a',
        state: CellState.WARNING,
        description: 'Технический английский'
    },
    {
        id: 5,
        name: 'История',
        code: 'ИСТ-202',
        hours: 2,
        color: '#9b4ae2',
        state: CellState.DEFAULT,
        description: 'История науки и техники'
    },
    {
        id: 6,
        name: 'Базы данных',
        code: 'БД-404',
        hours: 3,
        color: '#4ae2b0',
        state: CellState.SUCCESS,
        description: 'SQL и проектирование БД'
    },
];

// Цвета для дисциплин по умолчанию
export const DISCIPLINE_COLORS = [
    '#4a90e2', // синий
    '#e24a4a', // красный
    '#4ae24a', // зеленый
    '#e2b04a', // желтый
    '#9b4ae2', // фиолетовый
    '#4ae2b0', // бирюзовый
    '#e24a8a', // розовый
    '#e2e24a', // желто-зеленый
];