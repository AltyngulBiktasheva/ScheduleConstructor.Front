import type { Teacher } from '../types';
import { emptyWishes } from '../types';

export const MOCK_TEACHERS: Teacher[] = [
  {
    id: 't1',
    name: 'Иванов Иван Иванович',
    wishes: {
      ...emptyWishes(),
      preferredTimes: [
        { id: 'pw1', dayId: 'mon', timeStart: '09:00', timeEnd: '12:00' },
        { id: 'pw2', dayId: 'wed', timeStart: '09:00', timeEnd: '12:00' },
      ],
      forbiddenTimes: [
        { id: 'fw1', dayId: 'sat', timeStart: '08:00', timeEnd: '22:00' },
      ],
      preferredAudiences: [
        { id: 'pa1', roomId: '', roomName: 'Тургенева, 301' },
      ],
      comment: 'Прошу не ставить занятия позже 18:00.',
    },
  },
  {
    id: 't2',
    name: 'Петров Пётр Петрович',
    wishes: {
      ...emptyWishes(),
      undesirableTimes: [
        { id: 'uw1', dayId: 'mon', timeStart: '08:00', timeEnd: '10:00' },
      ],
    },
  },
  {
    id: 't3',
    name: 'Новикова Елена Николаевна',
    wishes: emptyWishes(),
  },
  {
    id: 't4',
    name: 'Сидоров Сергей Сергеевич',
    wishes: {
      ...emptyWishes(),
      forbiddenTimes: [
        { id: 'fw2', dayId: 'fri', timeStart: '16:00', timeEnd: '22:00' },
      ],
      undesirableAudiences: [
        { id: 'ua1', roomId: '', roomName: 'Куйбышева' },
      ],
    },
  },
  {
    id: 't5',
    name: 'Смирнова Анна Алексеевна',
    wishes: emptyWishes(),
  },
  {
    id: 't6',
    name: 'Козлов Виктор Викторович',
    wishes: {
      ...emptyWishes(),
      comment: 'Пожалуйста, учтите, что в первом семестре у меня ограниченная нагрузка.',
    },
  },
  {
    id: 't7',
    name: 'Орлов Дмитрий Викторович',
    wishes: emptyWishes(),
  },
];
