import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import styles from './SearchableSelect.module.scss';

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '— выберите —',
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value],
  );

  const filtered = useMemo(
    () =>
      query
        ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
        : options,
    [options, query],
  );

  // Закрытие по клику вне
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Фокус на input при открытии
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery('');
      setHighlightIdx(0);
    }
  }, [open]);

  // Скролл к подсвеченному элементу
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlightIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx, open]);

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[highlightIdx]) handleSelect(filtered[highlightIdx].value);
      }
    },
    [filtered, highlightIdx, handleSelect],
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setHighlightIdx(0);
  };

  if (disabled) {
    return (
      <div className={`${styles.trigger} ${styles.disabled} ${className ?? ''}`}>
        <span className={styles.label}>{selectedLabel || placeholder}</span>
        <span className={styles.arrow}>&#9662;</span>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className ?? ''}`} ref={containerRef}>
      {open ? (
        <input
          ref={inputRef}
          className={styles.trigger}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="Начните вводить..."
        />
      ) : (
        <button
          type="button"
          className={`${styles.trigger} ${!value ? styles.placeholder : ''}`}
          onClick={() => setOpen(true)}
        >
          <span className={styles.label}>{selectedLabel || placeholder}</span>
          <span className={styles.arrow}>&#9662;</span>
        </button>
      )}

      {open && (
        <ul className={styles.dropdown} ref={listRef}>
          {filtered.length === 0 ? (
            <li className={styles.empty}>Ничего не найдено</li>
          ) : (
            filtered.map((opt, idx) => (
              <li
                key={opt.value}
                className={`${styles.option} ${idx === highlightIdx ? styles.highlighted : ''} ${opt.value === value ? styles.selected : ''}`}
                onMouseEnter={() => setHighlightIdx(idx)}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.value); }}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
