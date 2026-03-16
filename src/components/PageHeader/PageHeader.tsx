import React from 'react';
import styles from './Styles.module.scss';

interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<Props> = ({ title, subtitle, children }) => (
  <div className={styles.header}>
    <div className={styles.text}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
    {children && <div className={styles.actions}>{children}</div>}
  </div>
);
