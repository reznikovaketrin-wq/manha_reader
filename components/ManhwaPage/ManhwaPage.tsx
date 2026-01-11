'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const { user } = useUser();
  const [lastReadEntry, setLastReadEntry] = useState<any | null>(null);
  const [readChaptersSet, setReadChaptersSet] = useState<Set<string>>(new Set());
  const [archivedRanges, setArchivedRanges] = useState<Range[]>([]);

  // Do not return early here — render a loading placeholder inside JSX
  // so hook order remains stable between renders.

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
  // compute first chapter to open (memoized at top-level to respect Hooks rules)
  const { computedFirstChapterId, computedFirstChapterPage } = useMemo(() => {
    if (!manhwa?.chapters) {
      return { computedFirstChapterId: '', computedFirstChapterPage: null };
    }
    const id = (lastReadEntry as any)?.chapter_id || manhwa.chapters?.[0]?.id || '';
    const page = (lastReadEntry as any)?.page_number ?? null;
    return { computedFirstChapterId: id, computedFirstChapterPage: page };
  }, [lastReadEntry?.chapter_id, lastReadEntry?.page_number, manhwa?.chapters?.length]);

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
            />
          )}
        </>
      )}
    </div>
  );
}

ManhwaPage.displayName = 'ManhwaPage';

export default ManhwaPage;