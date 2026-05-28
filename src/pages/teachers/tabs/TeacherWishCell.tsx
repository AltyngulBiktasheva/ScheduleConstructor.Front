import React, { useState, useEffect } from 'react';
import { teacherPreferenceApi } from '../../../api';
import type { TeacherPreferencesViewDto } from '../../../api';
import { Badge } from '../../../components/Badge/Badge';

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
    const preferred = prefs.filter((p) => p.teacherPreferenceType === 'Preferred').length;
    const undesirable = prefs.filter((p) => p.teacherPreferenceType === 'Undesirable').length;
    const restricted = prefs.filter((p) => p.teacherPreferenceType === 'Restricted').length;
    if (preferred === 0 && undesirable === 0 && restricted === 0) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
    return (
      <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {preferred > 0 && <Badge variant="green">{preferred} жел.</Badge>}
        {undesirable > 0 && <Badge variant="yellow">{undesirable} нежел.</Badge>}
        {restricted > 0 && <Badge variant="red">{restricted} запр.</Badge>}
      </span>
    );
  }

  if (column === 'room') {
    const prefs = data.teacherRoomPreferences ?? [];
    const preferred = prefs.filter((p) => p.teacherPreferenceType === 'Preferred').length;
    const undesirable = prefs.filter((p) => p.teacherPreferenceType === 'Undesirable').length;
    const restricted = prefs.filter((p) => p.teacherPreferenceType === 'Restricted').length;
    if (preferred === 0 && undesirable === 0 && restricted === 0) return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>;
    return (
      <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {preferred > 0 && <Badge variant="green">{preferred} жел.</Badge>}
        {undesirable > 0 && <Badge variant="yellow">{undesirable} нежел.</Badge>}
        {restricted > 0 && <Badge variant="red">{restricted} запр.</Badge>}
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
