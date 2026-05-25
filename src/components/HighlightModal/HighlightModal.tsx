import React from 'react';
import type { SlotHighlightMessage } from '../../api/slotHighlights';
import styles from './Styles.module.scss';

interface Props {
  messages: SlotHighlightMessage[];
  color: 'yellow' | 'red';
  onClose: () => void;
}

export const HighlightModal: React.FC<Props> = ({ messages, color, onClose }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {color === 'red' ? 'Ошибки' : 'Предупреждения'}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>&#10005;</button>
        </div>
        <div className={styles.list}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.item} ${color === 'red' ? styles.itemError : styles.itemWarning}`}
            >
              <span className={styles.time}>
                {msg.timeStart} &ndash; {msg.timeEnd}
              </span>
              <span className={styles.message}>{msg.message}</span>
            </div>
          ))}
          {messages.length === 0 && (
            <div className={styles.empty}>Нет сообщений</div>
          )}
        </div>
      </div>
    </div>
  );
};
