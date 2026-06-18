export const TOUR_TAB_SWITCH = 'tour:tab-switch';

export interface TourTabSwitchDetail {
  tabId: string;
}

export function dispatchTabSwitch(tabId: string): void {
  window.dispatchEvent(
    new CustomEvent<TourTabSwitchDetail>(TOUR_TAB_SWITCH, { detail: { tabId } }),
  );
}
