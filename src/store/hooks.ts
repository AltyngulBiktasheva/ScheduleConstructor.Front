import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/** Типизированный dispatch с поддержкой thunk */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Типизированный selector */
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
