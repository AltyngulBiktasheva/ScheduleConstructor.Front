import React from 'react';
import styles from './Styles.module.scss';

interface Props {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<Props> = ({ label, required, error, hint, children }) => (
  <div className={styles.field}>
    <label className={styles.label}>
      {label}
      {required && <span className={styles.required}>*</span>}
    </label>
    {children}
    {hint && !error && <p className={styles.hint}>{hint}</p>}
    {error && <p className={styles.error}>{error}</p>}
  </div>
);
