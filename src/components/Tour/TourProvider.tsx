/**
 * Провайдер онбординг-тура.
 *
 * Текущая реализация — заглушка с правильным публичным API.
 * Когда react-joyride появится в реестре npm:
 *   1. npm install react-joyride
 *   2. Раскомментировать импорты Joyride ниже
 *   3. Убрать комментарий с блока рендеринга <Joyride>
 */
import React, { createContext, useCallback, useContext, useState } from 'react';
import { getTourSteps } from './tourSteps';

// import Joyride, { type CallBackProps, STATUS } from 'react-joyride';

interface TourContextValue {
  isRunning: boolean;
  startTour: (tourId: string) => void;
  stopTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  isRunning: false,
  startTour: () => {},
  stopTour: () => {},
});

export function useTour(): TourContextValue {
  return useContext(TourContext);
}

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [tourId, setTourId] = useState<string>('main-overview');

  const startTour = useCallback((id: string) => {
    setTourId(id);
    setIsRunning(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
  }, []);

  const steps = getTourSteps(tourId);

  // Заглушка: просто логируем, что тур запущен, пока Joyride не доступен
  if (isRunning && steps.length > 0) {
    console.info('[Tour] Запущен тур:', tourId, '— шаги:', steps.map((s) => s.title ?? s.target).join(', '));
  }

  /*
  // Раскомментировать после установки react-joyride:
  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setIsRunning(false);
    }
  };
  */

  return (
    <TourContext.Provider value={{ isRunning, startTour, stopTour }}>
      {children}
      {/*
      <Joyride
        steps={steps}
        run={isRunning}
        continuous
        showSkipButton
        callback={handleCallback}
        locale={{
          back: 'Назад',
          close: 'Закрыть',
          last: 'Готово',
          next: 'Далее',
          skip: 'Пропустить',
        }}
        styles={{
          options: {
            primaryColor: '#2563eb',
          },
        }}
      />
      */}
    </TourContext.Provider>
  );
};
