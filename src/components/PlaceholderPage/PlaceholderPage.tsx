import React from 'react';
import styles from './Styles.module.scss';

interface Props {
  title: string;
  description: string;
  icon?: string;
}

export const PlaceholderPage: React.FC<Props> = ({ title, description, icon = '🚧' }) => (
  <div className={styles.page}>
    <div className={styles.content}>
      <span className={styles.icon}>{icon}</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <div className={styles.badge}>В разработке</div>
    </div>
  </div>
);
