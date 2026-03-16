import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../router/routes';
import styles from './Styles.module.scss';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>Страница не найдена</h1>
        <p className={styles.description}>
          Возможно, она была перемещена или ещё не создана.
        </p>
        <button className={styles.btn} onClick={() => navigate(ROUTES.CONSTRUCTOR)}>
          На главную
        </button>
      </div>
    </div>
  );
};
