import React from 'react';
import styles from './Styles.module.scss';

type Variant = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
}

export const Badge: React.FC<Props> = ({ children, variant = 'gray' }) => (
  <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>
);
