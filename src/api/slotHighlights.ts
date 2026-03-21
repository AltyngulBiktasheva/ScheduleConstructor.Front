import type { Discipline } from '../types';

export interface SlotHighlight {
  dayId: string;
  timeStart: string;
  timeEnd: string;
  color: 'green' | 'yellow' | 'red';
  message?: string;
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const TIME_SLOTS = [
  { timeStart: '08:00', timeEnd: '09:30' },
  { timeStart: '09:00', timeEnd: '10:30' },
  { timeStart: '10:40', timeEnd: '12:10' },
  { timeStart: '12:50', timeEnd: '14:20' },
  { timeStart: '14:30', timeEnd: '16:00' },
  { timeStart: '16:10', timeEnd: '17:40' },
  { timeStart: '17:50', timeEnd: '19:20' },
  { timeStart: '19:30', timeEnd: '21:00' },
];

function generateHighlights(discipline: Discipline): SlotHighlight[] {
  const highlights: SlotHighlight[] = [];

  DAYS.forEach((dayId) => {
    TIME_SLOTS.forEach(({ timeStart, timeEnd }) => {
      const hour = parseInt(timeStart.split(':')[0], 10);

      // Суббота — нежелательна
      if (dayId === 'sat') {
        highlights.push({ dayId, timeStart, timeEnd, color: 'yellow', message: 'Нежелательный день' });
        return;
      }

      // Вечерние слоты — нежелательны
      if (hour >= 18) {
        highlights.push({ dayId, timeStart, timeEnd, color: 'yellow', message: 'Нежелательное время' });
        return;
      }

      // Имитация занятых слотов
      const isBusy =
        (dayId === 'mon' && timeStart === '10:40') ||
        (dayId === 'wed' && timeStart === '14:30') ||
        (dayId === 'fri' && timeStart === '12:50');

      if (isBusy) {
        highlights.push({ dayId, timeStart, timeEnd, color: 'red', message: 'Слот занят другой дисциплиной' });
        return;
      }

      // Для корпуса Куйбышева утренний понедельник — занят
      if (discipline.building === 'kuybysheva' && dayId === 'mon' && hour < 12) {
        highlights.push({ dayId, timeStart, timeEnd, color: 'red', message: 'Аудитории корпуса Куйбышева заняты' });
        return;
      }

      highlights.push({ dayId, timeStart, timeEnd, color: 'green' });
    });
  });

  return highlights;
}

export async function fetchSlotHighlights(discipline: Discipline): Promise<SlotHighlight[]> {
  // Имитируем задержку сетевого запроса
  await new Promise((r) => setTimeout(r, 350));
  return generateHighlights(discipline);
}
