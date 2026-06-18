import { ROUTES } from '../../router/routes';
import type { TourDefinition } from './types';

export const COMPILER_TOUR: TourDefinition = {
  id: 'compiler',
  title: 'Знакомство с сервисом — Составитель',
  description:
    'Этот тур познакомит вас с основными разделами сервиса составления расписания: конструктором, ' +
    'проектами расписаний, группами, преподавателями, аудиториями и дисциплинами.',
  steps: [
    {
      id: 'ctr-welcome',
      target: '[data-tour="sidebar"]',
      title: 'Навигация',
      content:
        'Добро пожаловать! Слева расположено боковое меню — через него вы переходите между разделами. ' +
        'Сейчас мы на странице конструктора расписания.',
      nextLabel: 'Расскажи',
      placement: 'right',
      route: ROUTES.CONSTRUCTOR,
    },
    {
      id: 'ctr-tabs',
      target: '[data-tour="constructor-tabs"]',
      title: 'Вкладки конструктора',
      content:
        'Конструктор работает с тремя срезами: Группы, Преподаватели и Аудитории. ' +
        'Выберите нужный срез, затем конкретную сущность — и увидите её расписание на сетке.',
      nextLabel: 'Что дальше?',
      placement: 'bottom',
      route: ROUTES.CONSTRUCTOR,
    },
    {
      id: 'ctr-schedule',
      target: '[data-tour="schedule-selector"]',
      title: 'Выбор расписания',
      content:
        'Здесь вы выбираете проект расписания, с которым хотите работать. ' +
        'Все изменения на сетке применяются к выбранному проекту.',
      nextLabel: 'Как создать?',
      placement: 'bottom',
      route: ROUTES.CONSTRUCTOR,
    },
    {
      id: 'ctr-grid-info',
      target: '[data-tour="schedule-grid"]',
      title: 'Сетка расписания',
      content:
        'На сетке отображаются занятия выбранной группы/преподавателя/аудитории. ' +
        'Перетаскивайте карточки из списка дисциплин на нужный слот, чтобы назначить время.',
      nextLabel: 'Перейти',
      placement: 'top',
      route: ROUTES.CONSTRUCTOR,
    },

    // ── Расписания ──
    {
      id: 'sch-list',
      target: '[data-tour="page-content"]',
      title: 'Проекты расписания',
      content:
        'На этой странице хранятся все проекты расписаний. Вы можете создавать новые, ' +
        'редактировать существующие и удалять ненужные.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.SCHEDULES,
      tabId: 'list',
    },
    {
      id: 'sch-create',
      target: '[data-tour="form-area"]',
      title: 'Создание расписания',
      content:
        'Здесь вы создаёте новый проект расписания. Укажите название, выберите период действия ' +
        'и нажмите «Сохранить».',
      nextLabel: 'Что дальше?',
      placement: 'top',
      route: ROUTES.SCHEDULES,
      tabId: 'create',
    },

    // ── Группы ──
    {
      id: 'grp-list',
      target: '[data-tour="page-content"]',
      title: 'Академические группы',
      content:
        'Здесь представлен список всех академических групп. Группы используются при создании ' +
        'дисциплин и отображаются в конструкторе расписания.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.GROUPS,
      tabId: 'list',
    },
    {
      id: 'grp-tabs',
      target: '[data-tour="page-tabs"]',
      title: 'Группы и потоки',
      content:
        'Вы можете создать отдельную группу или объединить несколько групп в поток. ' +
        'Поток — это набор групп, у которых совпадают некоторые занятия.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.GROUPS,
      tabId: 'list',
    },
    {
      id: 'grp-create',
      target: '[data-tour="form-area"]',
      title: 'Создание группы',
      content:
        'Заполните название группы и при необходимости укажите дополнительные параметры. ' +
        'После сохранения группа появится в общем списке.',
      nextLabel: 'Далее',
      placement: 'top',
      route: ROUTES.GROUPS,
      tabId: 'create-group',
    },
    {
      id: 'grp-stream',
      target: '[data-tour="form-area"]',
      title: 'Создание потока',
      content:
        'Поток объединяет несколько групп. Выберите группы, которые будут входить в поток, ' +
        'и дайте ему название.',
      nextLabel: 'Что дальше?',
      placement: 'top',
      route: ROUTES.GROUPS,
      tabId: 'create-stream',
    },

    // ── Преподаватели ──
    {
      id: 'tch-list',
      target: '[data-tour="page-content"]',
      title: 'Преподаватели',
      content:
        'Список всех преподавателей. Здесь также отображаются их пожелания к расписанию, ' +
        'если они были заполнены.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.TEACHERS,
      tabId: 'list',
    },
    {
      id: 'tch-create',
      target: '[data-tour="form-area"]',
      title: 'Создание преподавателя',
      content:
        'Укажите ФИО преподавателя и другие данные. ' +
        'После создания преподаватель станет доступен для назначения на дисциплины.',
      nextLabel: 'Что дальше?',
      placement: 'top',
      route: ROUTES.TEACHERS,
      tabId: 'create',
    },

    // ── Аудитории ──
    {
      id: 'cls-list',
      target: '[data-tour="page-content"]',
      title: 'Аудитории',
      content:
        'Список всех аудиторий. Аудитории привязаны к корпусам и используются ' +
        'при создании дисциплин и расстановке занятий.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.CLASSROOMS,
      tabId: 'list',
    },
    {
      id: 'cls-create',
      target: '[data-tour="form-area"]',
      title: 'Создание аудитории',
      content:
        'Укажите номер аудитории, выберите корпус и при необходимости — вместимость. ' +
        'Аудитория будет доступна для назначения на дисциплины.',
      nextLabel: 'Что дальше?',
      placement: 'top',
      route: ROUTES.CLASSROOMS,
      tabId: 'create',
    },

    // ── Дисциплины ──
    {
      id: 'dsc-list',
      target: '[data-tour="page-content"]',
      title: 'Дисциплины',
      content:
        'Здесь хранятся все дисциплины. Дисциплина — это предмет с привязкой к группам, ' +
        'преподавателям и аудиториям. Есть корневые дисциплины (родительские) и обычные.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.DISCIPLINES,
      tabId: 'list',
    },
    {
      id: 'dsc-root',
      target: '[data-tour="form-area"]',
      title: 'Корневая дисциплина',
      content:
        'Корневая дисциплина — это «родитель» для обычных дисциплин. Она задаёт название предмета. ' +
        'Например, «Математический анализ» — корневая, а «Мат. анализ — лекция» — дочерняя.',
      nextLabel: 'Далее',
      placement: 'top',
      route: ROUTES.DISCIPLINES,
      tabId: 'create-root',
    },
    {
      id: 'dsc-field-root',
      target: '[data-tour="dsc-root-field"]',
      title: 'Привязка к корневой дисциплине',
      content:
        'Выберите корневую дисциплину и укажите вид занятия (лекция, практика, лабораторная и т.д.).',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.DISCIPLINES,
      tabId: 'create',
    },
    {
      id: 'dsc-field-assign',
      target: '[data-tour="dsc-assignments"]',
      title: 'Группы, преподаватели, аудитории',
      content:
        'Назначьте на дисциплину одну или несколько групп, преподавателей и аудиторий. ' +
        'Можно выбрать сразу несколько значений в каждом поле.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.DISCIPLINES,
      tabId: 'create',
    },
    {
      id: 'dsc-field-hours',
      target: '[data-tour="dsc-hours"]',
      title: 'Часы и тип',
      content:
        'Укажите количество часов, тип дисциплины (гибкая или фиксированная) ' +
        'и необходимость совмещения (обязательное или необязательное).',
      nextLabel: 'Далее',
      placement: 'top',
      route: ROUTES.DISCIPLINES,
      tabId: 'create',
    },
    {
      id: 'dsc-field-repeat',
      target: '[data-tour="dsc-repeat"]',
      title: 'Повторение занятий',
      content:
        'Настройте повторение: сколько раз в неделю проводится занятие, даты начала и окончания, ' +
        'время проведения. Кнопка «+ Добавить занятие» создаёт дополнительные слоты.',
      nextLabel: 'Далее',
      placement: 'top',
      route: ROUTES.DISCIPLINES,
      tabId: 'create',
    },

    // ── Завершение ──
    {
      id: 'ctr-done',
      title: 'Тур завершён!',
      content:
        'Вы познакомились со всеми разделами для составителя расписания. ' +
        'Теперь можете приступать к работе. Удачи!',
      nextLabel: 'Готово',
      route: ROUTES.CONSTRUCTOR,
    },
  ],
};

export const TEACHER_TOUR: TourDefinition = {
  id: 'teacher',
  title: 'Знакомство с сервисом — Преподаватель',
  description:
    'Этот тур покажет, как просматривать своё расписание и заполнять пожелания к расписанию.',
  steps: [
    {
      id: 'tch-sch-welcome',
      target: '[data-tour="page-content"]',
      title: 'Моё расписание',
      content:
        'На этой странице преподаватель может посмотреть своё расписание занятий на неделю. ' +
        'Сначала нужно выбрать себя из списка.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.TEACHER_SCHEDULE,
    },
    {
      id: 'tch-sch-picker',
      target: '[data-tour="teacher-picker"]',
      title: 'Выбор преподавателя',
      content:
        'Найдите своё имя в списке преподавателей. После выбора отобразится ваше расписание.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.TEACHER_SCHEDULE,
    },
    {
      id: 'tch-sch-grid',
      target: '[data-tour="page-content"]',
      title: 'Сетка расписания',
      content:
        'Здесь отображаются ваши занятия. Можно переключать недели, чтобы увидеть расписание ' +
        'на прошлую или следующую неделю. Нажмите на карточку занятия для подробной информации.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.TEACHER_SCHEDULE,
    },
    {
      id: 'tch-wishes-welcome',
      target: '[data-tour="page-content"]',
      title: 'Мои пожелания',
      content:
        'На этой странице вы можете заполнить пожелания к расписанию: ' +
        'удобное время, предпочтительные аудитории и другие параметры.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.TEACHER_WISHES,
    },
    {
      id: 'tch-wishes-picker',
      target: '[data-tour="teacher-picker"]',
      title: 'Выбор преподавателя',
      content: 'Выберите себя из списка, чтобы открыть форму пожеланий.',
      nextLabel: 'Далее',
      placement: 'bottom',
      route: ROUTES.TEACHER_WISHES,
    },
    {
      id: 'tch-wishes-editor',
      target: '[data-tour="page-content"]',
      title: 'Редактор пожеланий',
      content:
        'Здесь вы указываете, в какие дни и часы вам удобно проводить занятия, ' +
        'какие аудитории предпочитаете. Составитель расписания учтёт ваши пожелания.',
      nextLabel: 'Готово',
      placement: 'bottom',
      route: ROUTES.TEACHER_WISHES,
    },
  ],
};

export const TOURS: Record<string, TourDefinition> = {
  compiler: COMPILER_TOUR,
  teacher: TEACHER_TOUR,
};

export function getTourDefinition(tourId: string): TourDefinition | undefined {
  return TOURS[tourId];
}
