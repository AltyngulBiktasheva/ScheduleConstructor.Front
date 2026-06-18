import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { TeacherPicker } from '../../components/TeacherPicker/TeacherPicker';
import { TeacherForm } from '../teachers/tabs/TeacherForm';
import { WishesViewer } from './WishesViewer';
import { WishesEditor } from './WishesEditor';
import type { Teacher, TeacherWishes, TimeWish, AudienceWish } from '../../types/teacher';
import { emptyWishes } from '../../types/teacher';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchTeachersAll, updateTeacherLocally, saveTeacherOnServer } from '../../store/slices/teachersListSlice';
import { fetchSchedules } from '../../store/slices/scheduleSlice';
import { teacherPreferenceApi } from '../../api';
import type { TeacherPreferencesViewDto } from '../../api';
import { useEffect } from 'react';
import { useToast } from '../../components/Toast/ToastContext';
import { extractError } from '../../utils/extractError';
import styles from './Styles.module.scss';
import type { DayOfWeek } from '../../api/api/types';
import {v4 as uuidv4} from "uuid";

// ─── Mapping helpers ──────────────────────────────────────────────────────────

const DOW_TO_DAY_ID: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

const DAY_ID_TO_DOW: Record<string, DayOfWeek> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function mapPreferencesToWishes(dto: TeacherPreferencesViewDto): TeacherWishes {
  const wishes = emptyWishes();
  wishes.comment = dto.comment ?? '';

  for (const ta of dto.teacherTimePreferences ?? []) {
    const dayId = DOW_TO_DAY_ID[ta.dayOfWeekTimeInterval.dayOfWeek] ?? 'mon';
    const timeStart = ta.dayOfWeekTimeInterval.timeInterval.timeFrom.slice(0, 5);
    const timeEnd = ta.dayOfWeekTimeInterval.timeInterval.timeTo.slice(0, 5);
    const wish: TimeWish = { id: uuidv4(), dayId, timeStart, timeEnd };

    if (ta.teacherPreferenceType === 'Preferred') wishes.preferredTimes.push(wish);
    else if (ta.teacherPreferenceType === 'Restricted') wishes.forbiddenTimes.push(wish);
    else wishes.undesirableTimes.push(wish); // Undesirable
  }

  for (const rp of dto.teacherRoomPreferences ?? []) {
    const wish: AudienceWish = {
      id: uuidv4(),
      roomId: rp.roomId,
      roomName: rp.roomName,
    };
    if (rp.teacherPreferenceType === 'Preferred') wishes.preferredAudiences.push(wish);
    else if (rp.teacherPreferenceType === 'Restricted') wishes.forbiddenAudiences.push(wish);
    else wishes.undesirableAudiences.push(wish);
  }

  return wishes;
}

type PreferenceType = 'Preferred' | 'Undesirable' | 'Restricted';

function mapWishesToDto(teacherId: string, scheduleId: string, wishes: TeacherWishes) {
  const timeEntries: { teacherPreferenceType: PreferenceType; dayOfWeekTimeInterval: { dayOfWeek: DayOfWeek; timeInterval: { timeFrom: string; timeTo: string } } }[] = [];

  const pushTimes = (items: TimeWish[], type: PreferenceType) => {
    for (const w of items) {
      timeEntries.push({
        teacherPreferenceType: type,
        dayOfWeekTimeInterval: {
          dayOfWeek: DAY_ID_TO_DOW[w.dayId] ?? 1,
          timeInterval: { timeFrom: w.timeStart, timeTo: w.timeEnd },
        },
      });
    }
  };

  pushTimes(wishes.preferredTimes, 'Preferred');
  pushTimes(wishes.undesirableTimes, 'Undesirable');
  pushTimes(wishes.forbiddenTimes, 'Restricted');

  const roomEntries: { teacherPreferenceType: PreferenceType; roomId: string }[] = [];

  const pushRooms = (items: AudienceWish[], type: PreferenceType) => {
    for (const w of items) {
      if (w.roomId) roomEntries.push({ teacherPreferenceType: type, roomId: w.roomId });
    }
  };

  pushRooms(wishes.preferredAudiences, 'Preferred');
  pushRooms(wishes.undesirableAudiences, 'Undesirable');
  pushRooms(wishes.forbiddenAudiences, 'Restricted');

  return {
    teacherId,
    scheduleId,
    teacherTimePreferences: timeEntries,
    teacherRoomPreferences: roomEntries,
    comment: wishes.comment,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TeacherWishesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { teachers, loading } = useAppSelector((s) => s.teachersList);
  const selectedScheduleId = useAppSelector((s) => s.schedule.selectedScheduleId);
  const { addToast } = useToast();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [wishes, setWishes] = useState<TeacherWishes | null>(null);
  const [wishesLoading, setWishesLoading] = useState(false);
  const [wishesSaving, setWishesSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchSchedules());
    if (teachers.length === 0) {
      dispatch(fetchTeachersAll());
    }
  }, [dispatch, teachers.length]);

  const handleSelectTeacher = (t: Teacher) => {
    setTeacher(t);
    setWishes(emptyWishes());
    setIsEditing(false);

    if (!selectedScheduleId) return;

    setWishesLoading(true);
    teacherPreferenceApi
      .getTeacherPreferences({ teacherId: t.id, scheduleId: selectedScheduleId })
      .then(({ data }) => setWishes(mapPreferencesToWishes(data)))
      .catch(() => setWishes(emptyWishes()))
      .finally(() => setWishesLoading(false));
  };

  const handleSave = async (updated: TeacherWishes) => {
    setWishes(updated);
    setIsEditing(false);
    if (!teacher) return;

    dispatch(updateTeacherLocally({ ...teacher, wishes: updated }));

    if (!selectedScheduleId) return;

    setWishesSaving(true);
    try {
      await teacherPreferenceApi.saveTeacherPreference(
        mapWishesToDto(teacher.id, selectedScheduleId, updated),
      );
    } catch (err) {
      addToast(extractError(err), 'error');
    } finally {
      setWishesSaving(false);
    }
  };

  const handleCreateTeacher = async (newTeacher: Teacher) => {
    setCreateLoading(true);
    try {
      await dispatch(saveTeacherOnServer({ teacher: newTeacher, isNew: true })).unwrap();
      // After the list refreshes, find the teacher by name
      const result = await dispatch(fetchTeachersAll()).unwrap();
      const created = result.teachers.find((t: Teacher) => t.name === newTeacher.name);
      if (created) {
        handleSelectTeacher(created);
      }
      setShowCreateForm(false);
      addToast('Преподаватель успешно добавлен', 'success');
    } catch (err) {
      addToast(extractError(err), 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  if (!teacher || !wishes) {
    return (
      <div className={styles.page} data-tour="page-content">
        <PageHeader
          title="Мои пожелания"
          subtitle="Укажите предпочтения по времени и аудиториям"
        />
        {loading ? (
          <div className={styles.loading}>Загрузка преподавателей…</div>
        ) : showCreateForm ? (
          <div className={styles.createFormWrapper}>
            <h3 className={styles.createFormTitle}>Добавить себя в систему</h3>
            <TeacherForm
              onSave={handleCreateTeacher}
              onCancel={() => setShowCreateForm(false)}
              loading={createLoading}
            />
          </div>
        ) : (
          <>
            <div data-tour="teacher-picker">
              <TeacherPicker
                teachers={teachers}
                onSelect={handleSelectTeacher}
                title="Найдите себя в списке"
                subtitle="Выберите своё имя для просмотра и редактирования пожеланий"
              />
            </div>
            <button className={styles.selfAddBtn} onClick={() => setShowCreateForm(true)}>
              Нет в списке? Добавить себя
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Мои пожелания">
        <div className={styles.headerRight}>
          <span className={styles.teacherName}>{teacher.name}</span>
          <button
            className={styles.changeBtn}
            onClick={() => { setTeacher(null); setWishes(null); }}
          >
            Сменить
          </button>
        </div>
      </PageHeader>

      <div className={styles.content}>
        {wishesLoading ? (
          <div className={styles.loading}>Загрузка пожеланий…</div>
        ) : isEditing ? (
          <WishesEditor
            wishes={wishes}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <WishesViewer
            wishes={wishes}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </div>
    </div>
  );
};
