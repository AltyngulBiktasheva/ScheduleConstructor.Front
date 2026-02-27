import React from "react";
import {CellState} from '../constants/cellState.constants';
import { type CellPosition } from './grid.types';

export interface GridCellProps {
    day: number;
    timeSlot: number;
    state?: CellStateType;
    onDrop: (data: any, position: CellPosition) => void;
    children?: React.ReactNode;
}

export interface CellStateMap {
    [key: string]: CellStateType;
}

export type CellStateType = typeof CellState[keyof typeof CellState];