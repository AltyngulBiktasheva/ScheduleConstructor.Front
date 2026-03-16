import React from 'react';
import styles from './Styles.module.scss';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

export const Button: React.FC<Props> = ({
  variant = 'secondary',
  size = 'md',
  children,
  className,
  ...rest
}) => (
  <button
    className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className ?? ''}`}
    {...rest}
  >
    {children}
  </button>
);
