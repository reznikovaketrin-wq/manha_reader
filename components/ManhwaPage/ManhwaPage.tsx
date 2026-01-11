'use client';

import { memo, useState, useEffect, useMemo } from 'react';
import { RatingModal } from './RatingModal';
import { DesktopView } from './DesktopView';
import { MobileView } from './MobileView';
import { ManhwaPageProps } from './types';
import { useUser } from '@/app/providers/UserProvider';
import { getLastReadChapter, getReadingProgress } from '@/lib/supabase-client';

interface Range {
  s: number;
  e: number;
}

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
  clientRatingOverride = null,
}: ManhwaPageProps) {
  // Guard clause - render a stable placeholder instead of returning null
  // to avoid hydration/markup mismatches between renders
  if (!manhwa) {
    return (
      <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh' }} data-loading="manhwa">
        <div className="manhwa-loading" aria-hidden>
          Loading manhwa…
        </div>
      </div>
    );
  }

  const { user } = useUser();
  const [lastReadEntry, setLastReadEntry] = useState<any | null>(null);
  const [readChaptersSet, setReadChaptersSet] = useState<Set<string>>(new Set());
  const [archivedRanges, setArchivedRanges] = useState<Range[]>([]);

  // Load last read chapter
  useEffect(() => {
    let mounted = true;
    const loadLast = async () => {
      if (!user?.id) {
        setLastReadEntry(null);
        return;
      }

      try {
        const last = await getLastReadChapter(user.id, manhwaId);
        if (!mounted) return;
        if (last) {
          setLastReadEntry(last as any);
        } else {
          setLastReadEntry(null);
        }
      } catch (err) {
        console.error('Error loading last read chapter:', err);
        if (mounted) setLastReadEntry(null);
      }
    };

    loadLast();
    return () => { mounted = false; };
  }, [user?.id, manhwaId]);

  // Load reading progress (read chapters and archived ranges)
  useEffect(() => {
    let mounted = true;
    const loadProgress = async () => {
      if (!user?.id) {
        setReadChaptersSet(new Set());
        setArchivedRanges([]);
        return;
      }
      try {
        const progress = await getReadingProgress(user.id, manhwaId);
        if (!mounted) return;

        if (progress) {
          // read_chapters is already an array of chapter IDs (strings)
          const readChapterIds = new Set<string>(progress.read_chapters || []);
          setReadChaptersSet(readChapterIds);
          setArchivedRanges(progress.archived_ranges || []);
        } else {
          if (mounted) {
            setReadChaptersSet(new Set());
            setArchivedRanges([]);
          }
        }
      } catch (err) {
        console.error('Error loading reading progress:', err);
        if (mounted) {
          setReadChaptersSet(new Set());
          setArchivedRanges([]);
        }
      }
    };

    loadProgress();
    return () => { mounted = false; };
  }, [user?.id, manhwaId, manhwa?.chapters?.length]);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
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
      {/* compute and log first chapter to open */}
      {/* compute first chapter to open (memoized) */}
      {(() => {
        const { computedFirstChapterId, computedFirstChapterPage } = useMemo(() => {
          const id = lastReadEntry?.chapter_id || manhwa.chapters?.[0]?.id || '';
          const page = lastReadEntry?.page_number ?? null;
          return { computedFirstChapterId: id, computedFirstChapterPage: page };
        }, [lastReadEntry?.chapter_id, lastReadEntry?.page_number, manhwa.chapters?.length]);

        if (isMobile) {
          return (
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
            />
          );
        }

        return (
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
          />
        );
      })()}
      
    </div>
  );
});

ManhwaPage.displayName = 'ManhwaPage';

export default ManhwaPage;