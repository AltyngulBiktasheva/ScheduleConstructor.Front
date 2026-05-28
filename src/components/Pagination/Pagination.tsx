import React from 'react';
import styles from './Pagination.module.scss';

interface PaginationProps {
  page: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
}

const PAGE_SIZES = [20, 50, 100];

export const Pagination: React.FC<PaginationProps> = ({
  page,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}) => {
  // Скрываем, если все элементы помещаются на одной странице при дефолте 100
  if (totalItems <= 100 && itemsPerPage >= totalItems) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(page, totalPages);

  return (
    <div className={styles.pagination}>
      <div className={styles.left}>
        <span className={styles.label}>Показывать по</span>
        <select
          className={styles.sizeSelect}
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className={styles.center}>
        <button
          className={styles.navBtn}
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          &#8249; Назад
        </button>
        <span className={styles.pageInfo}>
          Страница {safePage} из {totalPages}
        </span>
        <button
          className={styles.navBtn}
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Далее &#8250;
        </button>
      </div>

      <div className={styles.right}>
        <span className={styles.total}>Всего: {totalItems}</span>
      </div>
    </div>
  );
};
