'use client';

import { memo } from 'react';
import styles from './MetaBlock.module.css';

interface MetaBlockProps {
  statusText: string;
  typeText: string;
  censorshipText: string;
  chaptersCount: number;
  totalViews: number;
  totalRating: number;
  ratingCount: number;
  onRatingClick: () => void;
}

export const MetaBlock = memo(function MetaBlock({
  statusText,
  typeText,
  censorshipText,
  chaptersCount,
  totalViews,
  totalRating,
  ratingCount,
  onRatingClick,
}: MetaBlockProps) {
  const formatViews = (views: number) => {
    if (views > 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    }
    if (views > 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  };

  return (
    <div className={styles.metaContainer}>
      {/* Статус */}
      <div className={styles.metaItem}>
        <img
          src="/icons/status-icon.png"
          alt="Status"
          className={styles.metaIcon}
        />
        <div className={styles.metaText}>
          <p className={styles.metaLabel}>Статус</p>
          <p className={styles.metaValue}>{statusText}</p>
        </div>
      </div>

      {/* Тип */}
      <div className={styles.metaItem}>
        <img
          src="/icons/type-icon.png"
          alt="Type"
          className={styles.metaIcon}
        />
        <div className={styles.metaText}>
          <p className={styles.metaLabel}>Тип</p>
          <p className={styles.metaValue}>{typeText}</p>
        </div>
      </div>

      {/* Цензура */}
      <div className={styles.metaItem}>
        <img
          src="/icons/censorship-icon.png"
          alt="Censorship"
          className={styles.metaIcon}
        />
        <div className={styles.metaText}>
          <p className={styles.metaLabel}>Цензура</p>
          <p className={styles.metaValue}>{censorshipText}</p>
        </div>
      </div>

      {/* Розділи */}
      <div className={styles.metaItem}>
        <img
          src="/icons/chapters-icon.png"
          alt="Chapters"
          className={styles.metaIcon}
        />
        <div className={styles.metaText}>
          <p className={styles.metaLabel}>Розділи</p>
          <p className={styles.metaValue}>{chaptersCount}</p>
        </div>
      </div>

      {/* Перегляди */}
      <div className={styles.metaItem}>
        <img
          src="/icons/views-icon.png"
          alt="Views"
          className={styles.metaIcon}
        />
        <div className={styles.metaText}>
          <p className={styles.metaLabel}>Перегляди</p>
          <p className={styles.metaValue}>{formatViews(totalViews)}</p>
        </div>
      </div>

      {/* Оцінка */}
      <div className={styles.metaItem}>
        <img
          src="/icons/rating-bubble.png"
          alt="Rating"
          className={styles.metaIcon}
        />
        <div className={styles.metaText}>
          <p className={styles.metaLabel}>Оцінка</p>
          <p className={styles.metaValue}>
            {totalRating.toFixed(1)}{' '}
            <span className={styles.metaRatingCount}>({ratingCount})</span>
          </p>
        </div>
      </div>

      {/* Кнопка оцінювання - margin-left: auto відштовхне її вправо */}
      <button className={styles.ratingButton} onClick={onRatingClick}>
        Оцінити
      </button>
    </div>
  );
});