import React, { useEffect } from 'react';
import styles from './Styles.module.scss';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  actions?: React.ReactNode;
}

export const Modal: React.FC<Props> = ({ title, onClose, children, width = 560, actions }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {actions && <div className={styles.footer}>{actions}</div>}
      </div>
    </div>
  );
};

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
