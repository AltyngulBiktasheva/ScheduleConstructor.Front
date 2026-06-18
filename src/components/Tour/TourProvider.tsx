import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { TourContextValue, TourId, TourState, TourStep, TourStatus } from './types';
import { COMPILER_TOUR, TEACHER_TOUR, getTourDefinition } from './tourSteps';
import { getTourStatus, setTourStatus, getTourStep, setTourStep, isFirstVisit } from './tourPersistence';
import { dispatchTabSwitch } from './tourEvents';
import { TourTooltip } from './TourTooltip';
import { TourModal } from './TourModal';

const INITIAL_STATE: TourState = {
  activeTourId: null,
  currentStepIndex: 0,
  phase: 'idle',
};

const TourContext = createContext<TourContextValue>({
  state: INITIAL_STATE,
  startTour: () => {},
  resumeTour: () => {},
  stopTour: () => {},
  skipTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  currentStep: null,
  totalSteps: 0,
  tourStatus: () => 'not-started',
});

export function useTour(): TourContextValue {
  return useContext(TourContext);
}

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<TourState>(() => {
    if (isFirstVisit()) {
      return { activeTourId: 'compiler', currentStepIndex: 0, phase: 'welcome' };
    }
    const compilerStatus = getTourStatus('compiler');
    if (compilerStatus === 'in-progress') {
      return { activeTourId: 'compiler', currentStepIndex: getTourStep('compiler'), phase: 'paused' };
    }
    const teacherStatus = getTourStatus('teacher');
    if (teacherStatus === 'in-progress') {
      return { activeTourId: 'teacher', currentStepIndex: getTourStep('teacher'), phase: 'paused' };
    }
    return INITIAL_STATE;
  });

  const deviationShownRef = useRef(false);

  const tourDef = state.activeTourId ? getTourDefinition(state.activeTourId) : undefined;
  const steps = tourDef?.steps ?? [];
  const currentStep: TourStep | null = state.phase === 'running' ? (steps[state.currentStepIndex] ?? null) : null;

  const navigateToStep = useCallback((step: TourStep) => {
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
    if (step.tabId) {
      setTimeout(() => dispatchTabSwitch(step.tabId!), 150);
    }
  }, [location.pathname, navigate]);

  const startTour = useCallback((tourId: TourId) => {
    const def = getTourDefinition(tourId);
    if (!def) return;
    setState({ activeTourId: tourId, currentStepIndex: 0, phase: 'welcome' });
  }, []);

  const resumeTour = useCallback(() => {
    if (!state.activeTourId) return;
    const step = steps[state.currentStepIndex];
    if (step) {
      deviationShownRef.current = false;
      setState((prev) => ({ ...prev, phase: 'running' }));
      setTourStatus(state.activeTourId, 'in-progress');
      navigateToStep(step);
    }
  }, [state.activeTourId, state.currentStepIndex, steps, navigateToStep]);

  const stopTour = useCallback(() => {
    if (state.activeTourId) {
      setTourStatus(state.activeTourId, 'skipped');
      setTourStep(state.activeTourId, 0);
    }
    setState(INITIAL_STATE);
    deviationShownRef.current = false;
  }, [state.activeTourId]);

  const skipTour = useCallback(() => {
    if (!state.activeTourId) return;
    setTourStatus(state.activeTourId, 'skipped');
    setTourStep(state.activeTourId, 0);

    if (state.activeTourId === 'compiler') {
      setState({ activeTourId: 'compiler', currentStepIndex: 0, phase: 'offer-next' });
    } else {
      setState(INITIAL_STATE);
    }
    deviationShownRef.current = false;
  }, [state.activeTourId]);

  const nextStep = useCallback(() => {
    if (!state.activeTourId) return;
    const nextIdx = state.currentStepIndex + 1;

    if (nextIdx >= steps.length) {
      setTourStatus(state.activeTourId, 'completed');
      setTourStep(state.activeTourId, 0);

      if (state.activeTourId === 'compiler') {
        setState({ activeTourId: 'compiler', currentStepIndex: 0, phase: 'offer-next' });
      } else {
        setState({ ...state, phase: 'completed' });
      }
      return;
    }

    const step = steps[nextIdx];
    setTourStep(state.activeTourId, nextIdx);
    setState((prev) => ({ ...prev, currentStepIndex: nextIdx }));
    deviationShownRef.current = false;
    navigateToStep(step);
  }, [state, steps, navigateToStep]);

  const prevStep = useCallback(() => {
    if (!state.activeTourId || state.currentStepIndex <= 0) return;
    const prevIdx = state.currentStepIndex - 1;
    const step = steps[prevIdx];
    setTourStep(state.activeTourId, prevIdx);
    setState((prev) => ({ ...prev, currentStepIndex: prevIdx }));
    deviationShownRef.current = false;
    navigateToStep(step);
  }, [state, steps, navigateToStep]);

  // Route deviation detection
  useEffect(() => {
    if (state.phase !== 'running' || !currentStep) return;
    if (location.pathname !== currentStep.route && !deviationShownRef.current) {
      deviationShownRef.current = true;
      if (state.activeTourId) {
        setTourStatus(state.activeTourId, 'in-progress');
        setTourStep(state.activeTourId, state.currentStepIndex);
      }
      setState((prev) => ({ ...prev, phase: 'deviation' }));
    }
  }, [location.pathname, state.phase, currentStep, state.activeTourId, state.currentStepIndex]);

  const tourStatusFn = useCallback((tourId: TourId): TourStatus => {
    return getTourStatus(tourId);
  }, []);

  const contextValue = useMemo<TourContextValue>(() => ({
    state,
    startTour,
    resumeTour,
    stopTour,
    skipTour,
    nextStep,
    prevStep,
    currentStep,
    totalSteps: steps.length,
    tourStatus: tourStatusFn,
  }), [state, startTour, resumeTour, stopTour, skipTour, nextStep, prevStep, currentStep, steps.length, tourStatusFn]);

  // Handle welcome → running transition
  const handleWelcomeStart = useCallback(() => {
    if (!state.activeTourId) return;
    setTourStatus(state.activeTourId, 'in-progress');
    setTourStep(state.activeTourId, 0);
    setState((prev) => ({ ...prev, currentStepIndex: 0, phase: 'running' }));
    const step = steps[0];
    if (step) navigateToStep(step);
  }, [state.activeTourId, steps, navigateToStep]);

  const handleOfferAccept = useCallback(() => {
    setState({ activeTourId: 'teacher', currentStepIndex: 0, phase: 'welcome' });
  }, []);

  const handleOfferDecline = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const handleCompletionDone = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const handleDeviationOk = useCallback(() => {
    if (state.activeTourId) {
      setTourStatus(state.activeTourId, 'in-progress');
      setTourStep(state.activeTourId, state.currentStepIndex);
    }
    setState((prev) => ({ ...prev, phase: 'paused' }));
  }, [state.activeTourId, state.currentStepIndex]);

  return (
    <TourContext.Provider value={contextValue}>
      {children}

      {state.phase === 'welcome' && tourDef && (
        <TourModal
          type="welcome"
          tourTitle={tourDef.title}
          tourDescription={tourDef.description}
          stepCount={tourDef.steps.length}
          onPrimary={handleWelcomeStart}
          onSecondary={skipTour}
        />
      )}

      {state.phase === 'running' && currentStep && (
        <TourTooltip
          step={currentStep}
          stepIndex={state.currentStepIndex}
          totalSteps={steps.length}
          onNext={nextStep}
          onPrev={prevStep}
          onStop={stopTour}
        />
      )}

      {state.phase === 'deviation' && tourDef && (
        <TourModal
          type="deviation"
          tourTitle={tourDef.title}
          onPrimary={handleDeviationOk}
        />
      )}

      {state.phase === 'completed' && tourDef && (
        <TourModal
          type="completion"
          tourTitle={tourDef.title}
          onPrimary={handleCompletionDone}
        />
      )}

      {state.phase === 'offer-next' && (
        <TourModal
          type="offer-next"
          tourTitle={TEACHER_TOUR.title}
          onPrimary={handleOfferAccept}
          onSecondary={handleOfferDecline}
        />
      )}

      {state.phase === 'paused' && tourDef && (
        <TourModal
          type="resume"
          tourTitle={tourDef.title}
          stepCount={steps.length}
          currentStep={state.currentStepIndex}
          onPrimary={resumeTour}
          onSecondary={stopTour}
        />
      )}
    </TourContext.Provider>
  );
};
