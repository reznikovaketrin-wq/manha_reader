'use client';

import { useMemo } from 'react';
import { RatingModal } from './RatingModal';
import { DesktopView } from './DesktopView';
import { MobileView } from './MobileView';
import { ManhwaPageProps } from './types';
import { useReadingProgress, createReadChaptersSet } from '@/lib/reading-progress';

/**
 * ManhwaPage - с React Query для прогресса чтения
 * ✅ Использует useReadingProgress для кеширования
 * ✅ Правильно управляет состоянием модалки
 * ✅ Правильно передает пропсы
 */
function ManhwaPage({
  manhwaId,
  manhwa,
  filteredChapters,
  isMobile,
  activeTab,
  showRatingModal,
  onTabChange,
  onRatingModalOpen,
  onRatingModalClose,
  onRatingSubmit,
  canRate = true,
  canComment = true,
  clientRatingOverride = null,
}: ManhwaPageProps) {
  // React Query хук для прогресса чтения
  const { data: progress, isLoading: isProgressLoading, error: progressError } = useReadingProgress(manhwaId);

  // Вычисляем Set прочитанных глав из данных прогресса
  const readChaptersSet = useMemo(() => {
    if (!progress) {
      return new Set<string>();
    }
    const set = createReadChaptersSet(progress.readChapterIds);
    
    // Временный лог для отладки
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ManhwaPage] ReadChapters debug:', {
        manhwaId,
        progressExists: !!progress,
        // Детальная информация по ID:
        savedChapterIds: JSON.stringify(progress.readChapterIds),
        allChapterIds: JSON.stringify(manhwa?.chapters?.map(ch => ch.id)),
        firstChapters: manhwa?.chapters?.slice(0, 5).map(ch => ({ id: ch.id, number: ch.chapterNumber })),
        // Проверка конкретных ID:
        hasChapter3: progress.readChapterIds?.includes('24'),
        hasChapter4: progress.readChapterIds?.includes('34'),
        expectedIDs: ['13', '18', '24', '34'], // Если пользователь читал 4 главы
      });
    }
    
    return set;
  }, [progress?.readChapterIds, manhwa?.chapters]);

  // Архивированные диапазоны из прогресса
  const archivedRanges = useMemo(() => {
    return progress?.archivedRanges ?? [];
  }, [progress?.archivedRanges]);

  // compute first chapter to open (memoized at top-level to respect Hooks rules)
  const { computedFirstChapterId, computedFirstChapterPage, hasProgress } = useMemo(() => {
    if (!manhwa?.chapters) {
      return { computedFirstChapterId: '', computedFirstChapterPage: null, hasProgress: false };
    }
    const id = progress?.currentChapterId || manhwa.chapters?.[0]?.id || '';
    const page = progress?.currentPage ?? null;
    const hasProgressValue = !!progress && !!progress.currentChapterId;
    return { 
      computedFirstChapterId: id, 
      computedFirstChapterPage: page, 
      hasProgress: hasProgressValue 
    };
  }, [progress?.currentChapterId, progress?.currentPage, manhwa?.chapters?.length, progress]);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      {!manhwa ? (
        <div data-loading="manhwa">
          <div className="manhwa-loading" aria-hidden>
            Loading manhwa…
          </div>
        </div>
      ) : (
        <>
          {/* ============================================
              МОДАЛКА РЕЙТИНГА - ПРАВИЛЬНАЯ
              ============================================ */}
          <RatingModal
            open={showRatingModal}
            onClose={onRatingModalClose}
            onSubmit={onRatingSubmit}
            currentRating={Math.round((clientRatingOverride ?? manhwa.rating) || 0)}
          />

          {/* ============================================
              ВЫБОР ВЕРСИИ (desktop / mobile)
              ============================================ */}
          {isMobile ? (
            <MobileView
              manhwaId={manhwaId}
              manhwa={{ ...manhwa, rating: clientRatingOverride ?? manhwa.rating }}
              filteredChapters={filteredChapters}
              activeTab={activeTab}
              canRate={canRate}
              canComment={canComment}
              onTabChange={onTabChange}
              onRatingModalOpen={onRatingModalOpen}
              firstChapterId={computedFirstChapterId}
              firstChapterPage={computedFirstChapterPage}
              readChapters={readChaptersSet}
              archivedRanges={archivedRanges}
              hasProgress={hasProgress}
            />
          ) : (
            <DesktopView
              manhwaId={manhwaId}
              manhwa={{ ...manhwa, rating: clientRatingOverride ?? manhwa.rating }}
              filteredChapters={filteredChapters}
              canRate={canRate}
              canComment={canComment}
              onRatingModalOpen={onRatingModalOpen}
              firstChapterId={computedFirstChapterId}
              firstChapterPage={computedFirstChapterPage}
              readChapters={readChaptersSet}
              archivedRanges={archivedRanges}
              hasProgress={hasProgress}
            />
          )}
        </>
      )}
    </div>
  );
}

ManhwaPage.displayName = 'ManhwaPage';

export default ManhwaPage;