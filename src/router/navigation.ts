import { ROUTES } from './routes';

export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: string;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'compiler',
    label: 'Для составителей',
    icon: 'grid',
    children: [
      { id: 'constructor', label: 'Конструктор расписания', path: ROUTES.CONSTRUCTOR, icon: 'calendar' },
      { id: 'disciplines', label: 'Дисциплины', path: ROUTES.DISCIPLINES, icon: 'book' },
      { id: 'classrooms', label: 'Аудитории', path: ROUTES.CLASSROOMS, icon: 'door' },
      { id: 'teachers', label: 'Преподаватели', path: ROUTES.TEACHERS, icon: 'user' },
      { id: 'groups', label: 'Академические группы', path: ROUTES.GROUPS, icon: 'users' },
    ],
  },
  {
    id: 'teacher',
    label: 'Для преподавателей',
    icon: 'briefcase',
    children: [
      { id: 'teacher-schedule', label: 'Моё расписание', path: ROUTES.TEACHER_SCHEDULE, icon: 'calendar' },
      { id: 'teacher-wishes', label: 'Мои пожелания', path: ROUTES.TEACHER_WISHES, icon: 'heart' },
    ],
  },
  {
    id: 'student',
    label: 'Для студентов',
    icon: 'graduation',
    path: ROUTES.STUDENT_SCHEDULE,
  },
];
