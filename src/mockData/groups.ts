import type { Group, Stream } from '../types/group';

export const MOCK_STREAMS: Stream[] = [
  {
    id: 'stream-1',
    name: 'Поток РИ-2023',
    groupIds: ['ri-230001', 'ri-230002'],
    disciplineIds: ['d5'],
  },
  {
    id: 'stream-2',
    name: 'Поток МТ-2022',
    groupIds: ['mt-220001', 'mt-220002'],
    disciplineIds: [],
  },
  {
    id: 'stream-3',
    name: 'Поток ЭК-2024',
    groupIds: ['ek-240001'],
    disciplineIds: [],
  },
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'ri-230001',
    name: 'РИ-230001',
    streamId: 'stream-1',
    subgroups: [
      { id: 'ri-230001-1', name: 'РИ-230001/1' },
      { id: 'ri-230001-2', name: 'РИ-230001/2' },
    ],
    studentCount: 25,
    disciplineIds: ['d1', 'd2', 'd3', 'd4'],
  },
  {
    id: 'ri-230002',
    name: 'РИ-230002',
    streamId: 'stream-1',
    subgroups: [
      { id: 'ri-230002-1', name: 'РИ-230002/1' },
      { id: 'ri-230002-2', name: 'РИ-230002/2' },
    ],
    studentCount: 24,
    disciplineIds: ['d1', 'd3'],
  },
  {
    id: 'mt-220001',
    name: 'МТ-220001',
    streamId: 'stream-2',
    subgroups: [
      { id: 'mt-220001-1', name: 'МТ-220001/1' },
      { id: 'mt-220001-2', name: 'МТ-220001/2' },
    ],
    studentCount: 28,
    disciplineIds: [],
  },
  {
    id: 'mt-220002',
    name: 'МТ-220002',
    streamId: 'stream-2',
    subgroups: [],
    studentCount: 22,
    disciplineIds: [],
  },
  {
    id: 'ek-240001',
    name: 'ЭК-240001',
    streamId: 'stream-3',
    subgroups: [
      { id: 'ek-240001-1', name: 'ЭК-240001/1' },
      { id: 'ek-240001-2', name: 'ЭК-240001/2' },
    ],
    studentCount: 30,
    disciplineIds: [],
  },
];
