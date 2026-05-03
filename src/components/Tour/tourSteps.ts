/**
 * Реестр шагов онбординг-тура.
 *
 * Когда react-joyride будет добавлен в реестр npm — импортировать Step из 'react-joyride'
 * и заменить тип StepDef на Step.
 */

export interface StepDef {
  target: string;       // CSS-селектор или '[data-tour="..."]'
  title?: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  disableBeacon?: boolean;
}

const TOURS: Record<string, StepDef[]> = {
  'main-overview': [
    {
      target: '[data-tour="sidebar"]',
      title: 'Боковое меню',
      content: 'Здесь находится навигация по разделам приложения.',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '[data-tour="schedule-selector"]',
      title: 'Выбор расписания',
      content: 'Выберите расписание, с которым хотите работать.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="discipline-list"]',
      title: 'Список дисциплин',
      content: 'Перетащите дисциплину в нужный слот сетки расписания.',
      placement: 'right',
    },
    {
      target: '[data-tour="schedule-grid"]',
      title: 'Сетка расписания',
      content: 'Здесь отображается расписание. Можно масштабировать и переключать недели.',
      placement: 'top',
    },
  ],
};

export function getTourSteps(tourId: string): StepDef[] {
  return TOURS[tourId] ?? [];
}
