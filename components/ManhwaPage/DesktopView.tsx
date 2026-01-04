'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { MetaBlock } from './MetaBlock';
import { TitleBlock } from './TitleBlock';
import { ChaptersList } from './ChaptersList/ChaptersList';
import { CommentsBlock } from './CommentsBlock';
import buttonStyles from './ReadButton.module.css';
import { ViewProps } from './types';

interface DesktopViewExtendedProps extends ViewProps {
  firstChapterId: string;
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

export const DesktopView = memo(function DesktopView({
  manhwaId,
  manhwa,
  filteredChapters,
  canRate = true,
  onRatingModalOpen,
  firstChapterId,
}: DesktopViewExtendedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

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
    }));

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px', width: '100%' }}>
        {/* ============================================
            ЛЕВАЯ КОЛОНКА - ОБЛОЖКА И КНОПКИ
            ============================================ */}
        <div>
          {/* Обложка */}
          <div
            style={{
              marginBottom: '18px',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#2A2A2A',
              width: '300px',
              aspectRatio: '3/4',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundImage: `url(${manhwa.coverImage})`
            }}
          />

          {/* Кнопка "Читати" */}
          <Link href={`/reader/${manhwa.id}/${firstChapterId}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
              <button className={buttonStyles.readButtonGradient} style={{ width: '100%' }}>
                <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
                {firstChapterId && firstChapterId !== manhwa.chapters[0]?.id ? 'Продовжити' : 'Читати'}
              </button>
          </Link>

          {/* Кнопка "Додати в список" */}
          <button
            style={{
              width: '100%',
              padding: '14px 22px',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              border: '1px solid #3A3A3A',
              borderRadius: '12px',
              transition: 'all 0.2s',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#A259FF'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#3A3A3A'}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Додати в список
          </button>
        </div>

        {/* ============================================
            ПРАВА КОЛОНКА - КОНТЕНТ
            ============================================ */}
        <div>
          {/* Заголовок */}
          <TitleBlock
            title={manhwa.title}
            description={manhwa.description}
            isMobile={false}
          />

          {/* Метаданные - ✅ с трансформацией */}
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

          {/* Две колонки контента */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            {/* Левый блок - Розділи */}
            <div style={{ border: '1px solid #3A3A3A', borderRadius: '12px', padding: '20px', backgroundColor: '#0A0A0A' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/icons/chapters-icon.png" alt="Chapters" style={{ width: '20px', height: '20px' }} />
                Розділи ({adaptedChapters.length})
              </h3>

              {/* Поле пошуку з сортировкою */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: '5px', alignItems: 'center', backgroundColor: 'transparent', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '0 12px' }}>
                <input
                  type="text"
                  placeholder="Номер або назва розділу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, backgroundColor: 'transparent', border: 'none', padding: '10px 16px', color: '#CFCFCF', fontSize: '14px', outline: 'none' }}
                />
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? null : 'desc')}
                  style={{ padding: '0', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                >
                  <img src="/icons/arrow-up-icon.png" alt="Sort Up" style={{ width: sortOrder === 'desc' ? '25px' : '23px', height: sortOrder === 'desc' ? '25px' : '23px', filter: sortOrder === 'desc' ? 'brightness(3)' : 'brightness(1)' }} />
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? null : 'asc')}
                  style={{ padding: '0', backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                >
                  <img src="/icons/arrow-down-icon.png" alt="Sort Down" style={{ width: sortOrder === 'asc' ? '25px' : '23px', height: sortOrder === 'asc' ? '25px' : '23px', filter: sortOrder === 'asc' ? 'brightness(3)' : 'brightness(1)' }} />
                </button>
              </div>

              {/* Список розділів */}
              <ChaptersList
                chapters={adaptedChapters}
                manhwaId={manhwaId}
                readChapters={new Set()}
                isMobile={false}
              />
            </div>

            {/* Правый блок - Коментарі */}
            <div style={{ border: '1px solid #3A3A3A', borderRadius: '12px', padding: '20px', backgroundColor: '#0A0A0A' }}>
              <CommentsBlock manhwaId={manhwaId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DesktopView.displayName = 'DesktopView';