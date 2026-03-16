import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { GroupPicker } from '../../components/GroupPicker/GroupPicker';
import { ScheduleGrid } from '../../components/ScheduleGrid/ScheduleGrid';
import { MOCK_GROUPS, MOCK_STREAMS } from '../../mockData/groups';
import { MOCK_DISCIPLINES } from '../../mockData/schedule';
import styles from './Styles.module.scss';

export const StudentSchedulePage: React.FC = () => {
  const [selection, setSelection] = useState<{ ids: string[]; label: string } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  if (!selection) {
    return (
      <div className={styles.page}>
        <PageHeader
          title="Расписание"
          subtitle="Выберите группу для просмотра расписания"
        />
        <GroupPicker
          groups={MOCK_GROUPS}
          streams={MOCK_STREAMS}
          onSelect={(ids, label) => setSelection({ ids, label })}
        />
      </div>
    );
  }

  const groupDisciplines = MOCK_DISCIPLINES.filter((d) =>
    d.isInGrid && selection.ids.some(() =>
      d.dayId != null
    )
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
