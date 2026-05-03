import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS, type NavItem } from '../../router/navigation';
import styles from './Styles.module.scss';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<Props> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    NAV_ITEMS.forEach((item) => {
      if (item.children?.some((child) => location.pathname.startsWith(child.path || ''))) {
        initial.add(item.id);
      }
    });
    return initial;
  });

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onToggle} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`} data-tour="sidebar">
        <div className={styles.header}>
          {isOpen && (
            <div className={styles.logo}>
              <span className={styles.logoIcon}>📅</span>
              <span className={styles.logoText}>Расписание</span>
            </div>
          )}
          <button
            className={styles.toggleBtn}
            onClick={onToggle}
            title={isOpen ? 'Свернуть' : 'Развернуть'}
          >
            {isOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavGroup
              key={item.id}
              item={item}
              isOpen={isOpen}
              isExpanded={expandedIds.has(item.id)}
              onToggleExpand={() => toggleExpanded(item.id)}
            />
          ))}
        </nav>

        {isOpen && (
          <div className={styles.footer}>
            <span className={styles.footerText}>УрФУ · Расписание</span>
          </div>
        )}
      </aside>
    </>
  );
};

// ─── NavGroup ─────────────────────────────────────────────────────────────────

interface NavGroupProps {
  item: NavItem;
  isOpen: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const NavGroup: React.FC<NavGroupProps> = ({ item, isOpen, isExpanded, onToggleExpand }) => {
  const location = useLocation();
  const hasChildren = Boolean(item.children?.length);
  const isGroupActive = item.children?.some((c) => location.pathname.startsWith(c.path || '##'));

  if (!hasChildren && item.path) {
    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `${styles.navItem} ${isActive ? styles.active : ''} ${!isOpen ? styles.collapsed : ''}`
        }
        title={!isOpen ? item.label : undefined}
      >
        <span className={styles.navIcon}><NavIcon name={item.icon} /></span>
        {isOpen && <span className={styles.navLabel}>{item.label}</span>}
      </NavLink>
    );
  }

  return (
    <div className={styles.navGroup}>
      <button
        className={`${styles.navItem} ${styles.groupToggle} ${isGroupActive ? styles.groupActive : ''} ${!isOpen ? styles.collapsed : ''}`}
        onClick={onToggleExpand}
        title={!isOpen ? item.label : undefined}
      >
        <span className={styles.navIcon}><NavIcon name={item.icon} /></span>
        {isOpen && (
          <>
            <span className={styles.navLabel}>{item.label}</span>
            <span className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}>
              <ChevronDownIcon />
            </span>
          </>
        )}
      </button>

      {isOpen && hasChildren && (
        <div className={`${styles.children} ${isExpanded ? styles.childrenOpen : ''}`}>
          {item.children!.map((child) => (
            <NavLink
              key={child.id}
              to={child.path!}
              end
              className={({ isActive }) =>
                `${styles.childItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.childDot} />
              <span>{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const NavIcon: React.FC<{ name: string }> = ({ name }) => {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    book: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    door: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M13 4L2 20" />
        <circle cx="16" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    users: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    briefcase: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    heart: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    graduation: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
};

const ChevronLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
