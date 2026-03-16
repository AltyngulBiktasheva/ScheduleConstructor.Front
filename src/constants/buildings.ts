export type BuildingType = 'turgeneva' | 'kuybysheva' | 'online' | 'other';

export interface BuildingOption {
  value: BuildingType;
  label: string;
}

export const BUILDING_OPTIONS: BuildingOption[] = [
  { value: 'turgeneva', label: 'Тургенева' },
  { value: 'kuybysheva', label: 'Куйбышева' },
  { value: 'online', label: 'Онлайн' },
  { value: 'other', label: 'Другой корпус' },
];
