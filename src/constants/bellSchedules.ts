export interface BellSlot {
  pairNumber: number;
  timeStart: string; // HH:MM
  timeEnd: string;   // HH:MM
}

export interface BellSchedule {
  id: string;
  name: string;
  slots: BellSlot[];
}

export const BELL_SCHEDULES: BellSchedule[] = [
  {
    id: 'turgeneva',
    name: 'Тургенева',
    slots: [
      { pairNumber: 1, timeStart: '09:00', timeEnd: '10:30' },
      { pairNumber: 2, timeStart: '10:40', timeEnd: '12:10' },
      { pairNumber: 3, timeStart: '12:50', timeEnd: '14:20' },
      { pairNumber: 4, timeStart: '14:30', timeEnd: '16:00' },
      { pairNumber: 5, timeStart: '16:10', timeEnd: '17:40' },
      { pairNumber: 6, timeStart: '17:50', timeEnd: '19:20' },
      { pairNumber: 7, timeStart: '19:30', timeEnd: '21:00' },
    ],
  },
  {
    id: 'kuybusheva',
    name: 'Куйбышева',
    slots: [
      { pairNumber: 1, timeStart: '08:30', timeEnd: '10:00' },
      { pairNumber: 2, timeStart: '10:10', timeEnd: '11:40' },
      { pairNumber: 3, timeStart: '11:40', timeEnd: '13:10' },
      { pairNumber: 4, timeStart: '13:50', timeEnd: '15:20' },
      { pairNumber: 5, timeStart: '15:30', timeEnd: '17:00' },
      { pairNumber: 6, timeStart: '17:10', timeEnd: '18:40' },
      { pairNumber: 7, timeStart: '18:50', timeEnd: '20:20' },
    ],
  },
];
