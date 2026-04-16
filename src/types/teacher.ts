import type { BoardType } from './classroom';

export type WishPriority = 'preferred' | 'undesirable' | 'forbidden';

export interface TimeWish {
  id: string;
  dayId: string;
  timeStart: string;
  timeEnd: string;
}

export interface AudienceWish {
  id: string;
  roomId: string;
  roomName: string;
}

export interface TeacherWishes {
  preferredTimes: TimeWish[];
  undesirableTimes: TimeWish[];
  forbiddenTimes: TimeWish[];
  preferredAudiences: AudienceWish[];
  undesirableAudiences: AudienceWish[];
  forbiddenAudiences: AudienceWish[];
  comment: string;
  // Предпочтения по оборудованию
  preferredBoardType: BoardType | null;  // null = нет предпочтений
  needsProjector: boolean | null;        // null = нет предпочтений
}

export interface Teacher {
  id: string;
  name: string;
  contacts?: string;
  wishes: TeacherWishes;
}

export function emptyWishes(): TeacherWishes {
  return {
    preferredTimes: [],
    undesirableTimes: [],
    forbiddenTimes: [],
    preferredAudiences: [],
    undesirableAudiences: [],
    forbiddenAudiences: [],
    comment: '',
    preferredBoardType: null,
    needsProjector: null,
  };
}
