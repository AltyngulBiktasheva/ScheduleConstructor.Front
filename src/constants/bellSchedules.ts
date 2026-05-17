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
      { pairNumber: 1, timeStart: '09:00', timeEnd: '10:35' },
      { pairNumber: 2, timeStart: '10:50', timeEnd: '12:25' },
      { pairNumber: 3, timeStart: '13:10', timeEnd: '14:45' },
      { pairNumber: 4, timeStart: '15:00', timeEnd: '16:35' },
      { pairNumber: 5, timeStart: '16:50', timeEnd: '18:25' },
      { pairNumber: 6, timeStart: '18:40', timeEnd: '20:15' },
      { pairNumber: 7, timeStart: '20:30', timeEnd: '22:05' },
    ],
  },
];
