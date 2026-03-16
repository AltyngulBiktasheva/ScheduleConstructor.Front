import React from 'react';
import styles from './Styles.module.scss';

export interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<Props> = ({ tabs, activeId, onChange }) => (
  <div className={styles.tabs}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        className={`${styles.tab} ${activeId === tab.id ? styles.active : ''}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
