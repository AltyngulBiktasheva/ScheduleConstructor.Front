export const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const;
export const TIME_SLOTS = 7;

export const BLOCK_WIDTH = 200;
export const BLOCK_HEIGHT = 100;

export type DayOfWeek = typeof DAYS[number];