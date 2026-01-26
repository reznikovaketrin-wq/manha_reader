'use client';

import { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { MetaBlock } from './MetaBlock';
import { TitleBlock } from './TitleBlock';
import ChaptersList from './ChaptersList/ChaptersList';
import { CommentsBlock } from './CommentsBlock';
import { loadManhwaComments } from '@/lib/comments.utils';
import { AddToListButton } from '@/components/AddToListButton/AddToListButton';
import buttonStyles from './ReadButton.module.css';
import styles from './MobileView.module.css';
import metaStyles from './MetaBlock.module.css';
import { MobileViewProps } from './types';

interface Range {
  s: number;
  e: number;
}

interface MobileViewExtendedProps extends MobileViewProps {
  firstChapterId?: string;
  firstChapterPage?: number | null;
  readChapters?: Set<string>;
  archivedRanges?: Range[];
  hasProgress?: boolean;
}

/**
 * Helper функции для трансформации данных
 */
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ongoing': 'ОНГОІНГ',
    'completed': 'ЗАВЕРШЕНО',
    'hiatus': 'НА ПАУЗІ',
    'paused': 'НА ПАУЗІ',
  };
  return statusMap[status] || 'НЕВІДОМО';
};

const getTypeText = (type?: string): string => {
  const typeMap: Record<string, string> = {
    'manhwa': 'МАНХВА',
    'manga': 'МАНГА',
    'manhua': 'МАНЬХУА',
    'novel': 'НОВЕЛ',
  };
  return typeMap[type || 'manhwa'] || 'МАНХВА';
};

const getCensorshipText = (publicationType?: string): string => {
  return publicationType === 'uncensored' ? 'ВІДСУТНЯ' : 'ПРИСУТНЯ';
};

export const MobileView = memo(function MobileView({
  manhwaId,
  manhwa,
  filteredChapters,
  activeTab,
  canRate = true,
  onTabChange,
  onRatingModalOpen,
  firstChapterId = '',
  firstChapterPage = null,
  readChapters = new Set(),
  archivedRanges = [],
  hasProgress = false,
}: MobileViewExtendedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [commentsCount, setCommentsCount] = useState(0);
  // Prefetch comments count so tabs show correct number before comments tab mounts
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const data = await loadManhwaComments(manhwaId);
        if (!cancelled) setCommentsCount((data || []).filter((c: any) => !c.parent_comment_id).length);
      } catch (err) {
        // ignore
      }
    };

    fetchCount();

    return () => {
      cancelled = true;
    };
  }, [manhwaId]);

  // ============================================
  // ADAPTER: конвертируем domain главы
  // ============================================
  const adaptedChapters = filteredChapters
    .filter((chapter) => {
      const query = searchQuery.toLowerCase();
      return (
        chapter.number.toString().includes(query) ||
        (chapter.title && chapter.title.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (!sortOrder) return 0;
      return sortOrder === 'asc' ? a.number - b.number : b.number - a.number;
    })
    .map((chapter) => ({
      id: chapter.id,
      chapterNumber: chapter.number,
      title: chapter.title || '',
      pagesCount: chapter.pages,
      status: chapter.status || '',
      publishedAt: chapter.createdAt || new Date().toISOString(),
      // VIP fields (preserve from domain)
      vipOnly: (chapter as any).vipOnly,
      vipEarlyDays: (chapter as any).vipEarlyDays,
      publicAvailableAt: (chapter as any).publicAvailableAt,
    }));

  return (
    <div className={styles.container}>
      {/* Обложка */}
      <div
        className={styles.coverImage}
        style={{
          backgroundImage: `url(${manhwa.coverImage})`
        }}
      />

      {/* Заголовок */}
      <TitleBlock
        title={manhwa.title}
        description={manhwa.description}
        isMobile={true}
      />

      {/* Кнопка "Читати" */}
      <Link 
        href={`/reader/${manhwa.id}/${firstChapterId || manhwa.chapters[0]?.id}${firstChapterPage ? `?page=${firstChapterPage}` : ''}`}
        style={{ textDecoration: 'none', display: 'block', marginBottom: '0px' }}
      >
        <button
          className={buttonStyles.readButtonGradient}
          style={{ width: '100%' }}
          onClick={() => {
            const target = `/reader/${manhwa.id}/${firstChapterId || manhwa.chapters[0]?.id}${firstChapterPage ? `?page=${firstChapterPage}` : ''}`;
            console.log('[MobileView] Read button clicked', { target, firstChapterId, firstChapterPage });
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {hasProgress ? 'Продовжити' : 'Читати'}
        </button>
      </Link>

      {/* Кнопка "Додати в список" */}
      <div style={{ marginBottom: '11px' }}>
        <AddToListButton manhwaId={manhwaId} />
      </div>

      {/* ============================================
          ВЕРХНІЙ БЛОК - MetaBlock з класом topBlock
          Показує тільки перші 3 items
          ============================================ */}
      <div className={metaStyles.topBlock}>
        <MetaBlock
          statusText={getStatusText(manhwa.status)}
          typeText={getTypeText(manhwa.type)}
          censorshipText={getCensorshipText(manhwa.publicationType)}
          chaptersCount={manhwa.chapters.length}
          totalViews={manhwa.totalViews}
          totalRating={manhwa.rating}
          ratingCount={manhwa.ratingCount}
          onRatingClick={() => {}} // Пуста функція для верхнього блоку
        />
      </div>

      {/* ============================================
          ТАБЫ НАВИГАЦИЯ
          ============================================ */}
      <div className={styles.tabsContainer}>
        {/* Кнопки табов */}
        <div className={styles.tabsNav}>
          <button
            onClick={() => onTabChange('info')}
            className={`${styles.tabButton} ${activeTab === 'info' ? styles.active : ''}`}
          >
            <svg className={styles.tabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Інформація
          </button>
          <button
            onClick={() => onTabChange('chapters')}
            className={`${styles.tabButton} ${activeTab === 'chapters' ? styles.active : ''}`}
          >
            <img src="/icons/chapters-icon.png" alt="Chapters" className={styles.tabIcon} />
            Розділи ({manhwa.chapters.length})
          </button>
          <button
            onClick={() => onTabChange('comments')}
            className={`${styles.tabButton} ${activeTab === 'comments' ? styles.active : ''}`}
          >
            <svg className={styles.tabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Коментарі ({commentsCount})
          </button>
        </div>

        {/* Содержимое табов */}
        <div className={styles.tabContent}>
          {/* ТАБ 1: ІНФОРМАЦІЯ */}
          {activeTab === 'info' && (
            <div>
              {/* ============================================
                  НИЖНІЙ БЛОК - звичайний MetaBlock
                  Показує останні 3 items + кнопка
                  ============================================ */}
              <MetaBlock
                statusText={getStatusText(manhwa.status)}
                typeText={getTypeText(manhwa.type)}
                censorshipText={getCensorshipText(manhwa.publicationType)}
                chaptersCount={manhwa.chapters.length}
                totalViews={manhwa.totalViews}
                totalRating={manhwa.rating}
                ratingCount={manhwa.ratingCount}
                onRatingClick={onRatingModalOpen}
              />

              {/* Опис */}
              <div className={styles.description}>
                <p className={styles.descriptionText}>
                  {manhwa.description}
                </p>
              </div>
            </div>
          )}

          {/* ТАБ 2: РОЗДІЛИ */}
          {activeTab === 'chapters' && (
            <div>
              {/* Поле пошуку з сортировкой */}
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Розділ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? null : 'desc')}
                  className={styles.sortButton}
                >
                  <img 
                    src="/icons/arrow-up-icon.png" 
                    alt="Sort Up" 
                    className={`${styles.sortIcon} ${sortOrder === 'desc' ? styles.active : ''}`}
                  />
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? null : 'asc')}
                  className={styles.sortButton}
                >
                  <img 
                    src="/icons/arrow-down-icon.png" 
                    alt="Sort Down" 
                    className={`${styles.sortIcon} ${sortOrder === 'asc' ? styles.active : ''}`}
                  />
                </button>
              </div>

              {/* Список розділів */}
              <ChaptersList
                chapters={adaptedChapters}
                manhwaId={manhwaId}
                readChapters={readChapters}
                archivedRanges={archivedRanges}
                isMobile={true}
              />
            </div>
          )}

          {/* ТАБ 3: КОМЕНТАРІ */}
          {activeTab === 'comments' && (
            <div>
              <CommentsBlock 
                manhwaId={manhwaId} 
                onCommentsCountChange={setCommentsCount}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MobileView.displayName = 'MobileView';