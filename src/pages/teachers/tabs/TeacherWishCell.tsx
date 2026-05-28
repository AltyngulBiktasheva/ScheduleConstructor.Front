import React, { useState, useEffect } from 'react';
import { teacherPreferenceApi } from '../../../api';
import type { TeacherPreferencesViewDto, TeacherPreferenceType } from '../../../api';
import { Badge } from '../../../components/Badge/Badge';

const DOW_SHORT: Record<number, string> = {
  1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 0: 'Вс',
};

const fmtTime = (t: string) => t.slice(0, 5); // HH:MM:SS → HH:MM

const prefVariant = (type: TeacherPreferenceType): 'green' | 'yellow' | 'red' => {
  switch (type) {
    case 'Preferred': return 'green';
    case 'Undesirable': return 'yellow';
    case 'Restricted': return 'red';
  }
};

interface Props {
  teacherId: string;
  scheduleId: string;
  column: 'time' | 'room' | 'other';
}

export const TeacherWishCell: React.FC<Props> = React.memo(({ teacherId, scheduleId, column }) => {
  const [data, setData] = useState<TeacherPreferencesViewDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    teacherPreferenceApi
      .getTeacherPreferences({ teacherId, scheduleId })
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [teacherId, scheduleId]);

  if (loading) return <span style={{ color: '#9ca3af', fontSize: 12 }}>...</span>;
  if (!data) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;

  if (column === 'time') {
    const prefs = data.teacherTimePreferences ?? [];
    if (prefs.length === 0) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
    return (
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {prefs.map((p, i) => {
          const day = DOW_SHORT[p.dayOfWeekTimeInterval.dayOfWeek] ?? '?';
          const from = fmtTime(p.dayOfWeekTimeInterval.timeInterval.timeFrom);
          const to = fmtTime(p.dayOfWeekTimeInterval.timeInterval.timeTo);
          return (
            <Badge key={i} variant={prefVariant(p.teacherPreferenceType)}>
              {day}, {from}–{to}
            </Badge>
          );
        })}
      </span>
    );
  }

  if (column === 'room') {
    const prefs = data.teacherRoomPreferences ?? [];
    if (prefs.length === 0) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
    return (
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {prefs.map((p, i) => (
          <Badge key={i} variant={prefVariant(p.teacherPreferenceType)}>
            {p.roomName}
          </Badge>
        ))}
      </span>
    );
  }

  // column === 'other'
  const comment = data.comment?.trim();
  if (!comment) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
  return (
    <span style={{ fontSize: 12, color: '#4b5563', maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {comment}
    </span>
  );
});

TeacherWishCell.displayName = 'TeacherWishCell';
