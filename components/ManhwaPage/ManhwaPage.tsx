'use client';

import { memo, useState, useEffect } from 'react';
import { RatingModal } from './RatingModal';
import { DesktopView } from './DesktopView';
import { MobileView } from './MobileView';
import { ManhwaPageProps } from './types';
import { useUser } from '@/app/providers/UserProvider';
import { getLastReadChapter } from '@/lib/supabase-client';

/**
 * ManhwaPage - ИСПРАВЛЕННЫЙ с работающей RatingModal
 * ✅ Правильно управляет состоянием модалки
 * ✅ Правильно передает пропсы
 */
const ManhwaPage = memo(function ManhwaPage({
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
}: ManhwaPageProps) {
  // Guard clause
  if (!manhwa) {
    console.warn('⚠️ ManhwaPage: manhwa is null');
    return null;
  }

  console.log('📄 ManhwaPage рендерится', {
    manhwaId,
    isMobile,
    showRatingModal,
    manhwaRating: manhwa.rating,
  });

  const { user } = useUser();
  const [lastChapterId, setLastChapterId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadLast = async () => {
      if (!user?.id) {
        setLastChapterId(null);
        return;
      }

      try {
        const last = await getLastReadChapter(user.id, manhwaId);
        if (!mounted) return;
        if (last && last.chapter_id) {
          setLastChapterId(last.chapter_id as string);
        } else {
          setLastChapterId(null);
        }
      } catch (err) {
        console.error('Error loading last read chapter:', err);
        if (mounted) setLastChapterId(null);
      }
    };

    loadLast();
    return () => { mounted = false; };
  }, [user?.id, manhwaId]);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      {/* ============================================
          МОДАЛКА РЕЙТИНГА - ПРАВИЛЬНАЯ
          ============================================ */}
      <RatingModal
        open={showRatingModal}
        onClose={() => {
          console.log('🔔 RatingModal: нажата кнопка закрытия');
          onRatingModalClose();
        }}
        onSubmit={async (rating: number) => {
          console.log('🔔 RatingModal: отправляю оценку', rating);
          try {
            await onRatingSubmit(rating);
            console.log('✅ RatingModal: оценка успешно отправлена');
          } catch (error) {
            console.error('❌ RatingModal: ошибка отправки', error);
            throw error;
          }
        }}
        currentRating={Math.round(manhwa.rating)}
      />

      {/* ============================================
          ВЫБОР ВЕРСИИ (desktop / mobile)
          ============================================ */}
      {isMobile ? (
        <MobileView
          manhwaId={manhwaId}
          manhwa={manhwa}
          filteredChapters={filteredChapters}
          activeTab={activeTab}
          canRate={canRate}
          canComment={canComment}
          onTabChange={onTabChange}
          onRatingModalOpen={() => {
            console.log('🔔 MobileView: открываю модалку рейтинга');
            onRatingModalOpen();
          }}
          firstChapterId={lastChapterId || manhwa.chapters[0]?.id || ''}
        />
      ) : (
        <DesktopView
          manhwaId={manhwaId}
          manhwa={manhwa}
          filteredChapters={filteredChapters}
          canRate={canRate}
          canComment={canComment}
          onRatingModalOpen={() => {
            console.log('🔔 DesktopView: открываю модалку рейтинга');
            onRatingModalOpen();
          }}
          firstChapterId={lastChapterId || manhwa.chapters[0]?.id || ''}
        />
      )}
    </div>
  );
});

ManhwaPage.displayName = 'ManhwaPage';

export default ManhwaPage;