import type { TourId, TourStatus } from './types';

const STATUS_KEY = (id: TourId) => `tour_${id}_status`;
const STEP_KEY = (id: TourId) => `tour_${id}_step`;

export function getTourStatus(id: TourId): TourStatus {
  return (localStorage.getItem(STATUS_KEY(id)) as TourStatus) || 'not-started';
}

export function setTourStatus(id: TourId, status: TourStatus): void {
  localStorage.setItem(STATUS_KEY(id), status);
}

export function getTourStep(id: TourId): number {
  return parseInt(localStorage.getItem(STEP_KEY(id)) || '0', 10);
}

export function setTourStep(id: TourId, step: number): void {
  localStorage.setItem(STEP_KEY(id), String(step));
}

export function isFirstVisit(): boolean {
  return !localStorage.getItem(STATUS_KEY('compiler'));
}
