export const ROUTES = {
  ROOT: '/',

  // Для составителей
  CONSTRUCTOR: '/constructor',
  CONSTRUCTOR_SCHEDULE: '/constructor/schedule',
  SCHEDULES: '/constructor/schedules',
  DISCIPLINES: '/constructor/disciplines',
  CLASSROOMS: '/constructor/classrooms',
  TEACHERS: '/constructor/teachers',
  GROUPS: '/constructor/groups',

  // Для преподавателей
  TEACHER_SCHEDULE: '/teacher/schedule',
  TEACHER_WISHES: '/teacher/wishes',

  // Для студентов
  STUDENT_SCHEDULE: '/student',
} as const;
