export interface TimeSlot {
    id: string;
    start: string;
    end: string;
    displayStart: string;
    displayEnd: string;
}

export const TIME_SLOTS: TimeSlot[] = [
    { id: '1', start: '09:00', end: '10:30', displayStart: '9:00', displayEnd: '10:30' },
    { id: '2', start: '10:40', end: '12:10', displayStart: '10:40', displayEnd: '12:10' },
    { id: '3', start: '12:50', end: '14:20', displayStart: '12:50', displayEnd: '14:20' },
    { id: '4', start: '14:30', end: '16:00', displayStart: '14:30', displayEnd: '16:00' },
    { id: '5', start: '16:10', end: '17:40', displayStart: '16:10', displayEnd: '17:40' },
    { id: '6', start: '17:50', end: '19:20', displayStart: '17:50', displayEnd: '19:20' },
    { id: '7', start: '19:30', end: '21:10', displayStart: '19:30', displayEnd: '21:10' },
    { id: '8', start: '21:10', end: '23:59', displayStart: '21:10', displayEnd: '...' },
];

export const SLOT_WIDTH = 200;
export const SLOT_HEIGHT = 100;