import type { Classroom } from '../types/classroom';

export const MOCK_CLASSROOMS: Classroom[] = [
  { id: 'c1',  name: '101', building: 'turgeneva',  type: 'standard',    capacity: 30 },
  { id: 'c2',  name: '102', building: 'turgeneva',  type: 'standard',    capacity: 30 },
  { id: 'c3',  name: '201', building: 'turgeneva',  type: 'computer',    capacity: 24 },
  { id: 'c4',  name: '202', building: 'turgeneva',  type: 'computer',    capacity: 24 },
  { id: 'c5',  name: '301', building: 'turgeneva',  type: 'laboratory',  capacity: 20 },
  { id: 'c6',  name: '302', building: 'turgeneva',  type: 'standard',    capacity: 40 },
  { id: 'c7',  name: '401', building: 'turgeneva',  type: 'amphitheater',capacity: 120 },
  { id: 'c8',  name: '410', building: 'turgeneva',  type: 'standard',    capacity: 35 },
  { id: 'c9',  name: '101', building: 'kuybysheva', type: 'standard',    capacity: 25 },
  { id: 'c10', name: '102', building: 'kuybysheva', type: 'standard',    capacity: 25 },
  { id: 'c11', name: '201', building: 'kuybysheva', type: 'laboratory',  capacity: 18 },
  { id: 'c12', name: '205', building: 'kuybysheva', type: 'computer',    capacity: 20 },
  { id: 'c13', name: '301', building: 'kuybysheva', type: 'amphitheater',capacity: 80  },
  { id: 'c14', name: '401', building: 'kuybysheva', type: 'standard',    capacity: 30 },
  { id: 'c15', name: '501', building: 'kuybysheva', type: 'standard',    capacity: 32 },
];
