import React from 'react';
import styles from './Spinner.module.scss';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = { sm: 18, md: 28, lg: 44 };

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const px = SIZE_MAP[size];
  return (
    <span
      className={styles.spinner}
      style={{ width: px, height: px, borderWidth: size === 'sm' ? 2 : size === 'md' ? 3 : 4 }}
      role="status"
      aria-label="Загрузка"
    />
  );
};
