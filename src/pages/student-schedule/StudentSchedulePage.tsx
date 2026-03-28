import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { GroupPicker } from '../../components/GroupPicker/GroupPicker';
import { ScheduleGrid } from '../../components/ScheduleGrid/ScheduleGrid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchGroupsAll } from '../../store/slices/groupsListSlice';
import { fetchDisciplinesAll } from '../../store/slices/disciplinesListSlice';
import styles from './Styles.module.scss';

export const StudentSchedulePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { groups, streams, loading } = useAppSelector((s) => s.groupsList);
  const { disciplines } = useAppSelector((s) => s.disciplinesList);

  const [selection, setSelection] = useState<{ ids: string[]; label: string } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (groups.length === 0) dispatch(fetchGroupsAll());
    if (disciplines.length === 0) dispatch(fetchDisciplinesAll());
  }, [dispatch, groups.length, disciplines.length]);

  if (!selection) {
    return (
      <div className={styles.page}>
        <PageHeader
          title="Расписание"
          subtitle="Выберите группу для просмотра расписания"
        />
        {loading ? (
          <div>Загрузка…</div>
        ) : (
          <GroupPicker
            groups={groups}
            streams={streams}
            onSelect={(ids, label) => setSelection({ ids, label })}
          />
        )}
      </div>
    );
  }

  const groupDisciplines = disciplines.filter((d) =>
    d.isInGrid && selection.ids.some(() => d.dayId != null)
  );

  return (
    <div className={styles.page}>
      <PageHeader title="Расписание">
        <div className={styles.headerRight}>
          <span className={styles.selectionLabel}>{selection.label}</span>
          <button className={styles.changeBtn} onClick={() => setSelection(null)}>
            Изменить
          </button>
        </div>
      </PageHeader>

      <div className={styles.gridWrapper}>
        <ScheduleGrid
          disciplines={groupDisciplines}
          weekOffset={weekOffset}
          onWeekOffsetChange={setWeekOffset}
        />
      </div>
    </div>
  );
};
