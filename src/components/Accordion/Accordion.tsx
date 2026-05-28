import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Accordion.module.scss';

interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  /** Вызывается при первом раскрытии */
  onFirstOpen?: () => void;
}

export const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  defaultOpen = false,
  className,
  onFirstOpen,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const openedOnce = useRef(defaultOpen);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>(defaultOpen ? 'none' : '0px');

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !openedOnce.current) {
        openedOnce.current = true;
        onFirstOpen?.();
      }
      return next;
    });
  }, [onFirstOpen]);

  useEffect(() => {
    if (!bodyRef.current) return;
    if (open) {
      setMaxHeight(`${bodyRef.current.scrollHeight}px`);
      // После анимации убрать ограничение, чтобы контент мог расти
      const timer = setTimeout(() => setMaxHeight('none'), 250);
      return () => clearTimeout(timer);
    } else {
      // Сначала зафиксировать текущую высоту, потом схлопнуть
      setMaxHeight(`${bodyRef.current.scrollHeight}px`);
      requestAnimationFrame(() => setMaxHeight('0px'));
    }
  }, [open]);

  return (
    <div className={`${styles.accordion} ${className ?? ''}`}>
      <button className={styles.header} onClick={toggle} type="button">
        <span className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`}>&#9654;</span>
        <span className={styles.title}>{title}</span>
      </button>
      <div
        ref={bodyRef}
        className={styles.body}
        style={{ maxHeight, overflow: open && maxHeight === 'none' ? 'visible' : 'hidden' }}
      >
        <div className={styles.bodyInner}>{children}</div>
      </div>
    </div>
  );
};
