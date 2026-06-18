export type TourId = 'compiler' | 'teacher';
export type TourStatus = 'not-started' | 'in-progress' | 'completed' | 'skipped';
export type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface TourStep {
  id: string;
  target?: string;
  title: string;
  content: string;
  nextLabel: string;
  placement?: Placement;
  route: string;
  tabId?: string;
  highlightPadding?: number;
}

export interface TourDefinition {
  id: TourId;
  title: string;
  description: string;
  steps: TourStep[];
}

export interface TourState {
  activeTourId: TourId | null;
  currentStepIndex: number;
  phase: 'idle' | 'welcome' | 'running' | 'paused' | 'deviation' | 'completed' | 'offer-next';
}

export interface TourContextValue {
  state: TourState;
  startTour: (tourId: TourId) => void;
  resumeTour: () => void;
  stopTour: () => void;
  skipTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  currentStep: TourStep | null;
  totalSteps: number;
  tourStatus: (tourId: TourId) => TourStatus;
}
