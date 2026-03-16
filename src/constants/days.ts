export interface Day {
  id: string;
  name: string;
  shortName: string;
}

export const DAYS: Day[] = [
  { id: 'mon', name: 'Понедельник', shortName: 'Пн' },
  { id: 'tue', name: 'Вторник',     shortName: 'Вт' },
  { id: 'wed', name: 'Среда',       shortName: 'Ср' },
  { id: 'thu', name: 'Четверг',     shortName: 'Чт' },
  { id: 'fri', name: 'Пятница',     shortName: 'Пт' },
  { id: 'sat', name: 'Суббота',     shortName: 'Сб' },
];
