'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Hooks
import {
  useReaderData,
  useReaderScroll,
  useReaderUI,
  useReaderHotkeys,
  useAutoScroll,
  useReadingProgress,
  useSwipeGestures,
} from './hooks';
import { ChapterCommentsComponent } from '@/components/chapter-comments';

// Components
import {
  ReaderLayout,
  ReaderHeader,
  ReaderFooter,
  ReaderSettingsPanel,
  ReaderChapterList,
  ReaderContent,
} from './components';


/**
 * ReaderPage - Composition Root
 * 
 * Features:
 * - Width modes (fit / fixed 720px / original)
 * - Fullscreen API (hides browser UI on mobile)
 * - Copy protection
 * - Swipe gestures
 * - Keyboard navigation
 */
export default function ReaderPage() {
  const params = useParams();
  const manhwaId = params?.id as string;
  const chapterId = params?.chapterId as string;

  // === Data Layer ===
  const readerData = useReaderData({ manhwaId, initialChapterId: chapterId });
  const { manhwa, chapters, isLoading, error, loadChapter, preloadNext } = readerData;

  // === UI State ===
  const ui = useReaderUI();

  // === Calculate total pages ===
  const totalPages = useMemo(
    () => chapters.reduce((sum, ch) => sum + ch.pages.length, 0),
    [chapters]
  );

  // === Scroll Tracking ===
  const scroll = useReaderScroll({ totalPages });

  // === Hotkeys ===
  useReaderHotkeys({
    onToggleUI: ui.toggleUI,
    onScrollNext: scroll.scrollNext,
    onScrollPrev: scroll.scrollPrev,
    onToggleFullscreen: ui.toggleFullscreen,
    enabled: true,
  });

  // === Swipe Gestures (mobile) ===
  useSwipeGestures({
    containerRef: scroll.contentRef,
    onTap: ui.toggleUI,
    // Swipe up/down handled by native scroll
    enabled: true,
  });

  // === Auto Scroll ===
  useAutoScroll({
    enabled: ui.autoScroll,
    speed: ui.autoScrollSpeed,
    containerRef: scroll.contentRef,
  });

  // === Reading Progress ===
  useReadingProgress({
    manhwaId,
    chapters,
    currentPage: scroll.currentPage,
  });

  // === Initial Data Load ===
  useEffect(() => {
    const init = async () => {
      const data = await (readerData as any)._loadManhwa();
      if (data) {
        await loadChapter(chapterId);
        (readerData as any)._setIsLoading(false);
      }
    };
    init();
  }, [manhwaId, chapterId]);

  // === Preload Trigger ===
  useEffect(() => {
    if (scroll.shouldPreload) {
      preloadNext();
    }
  }, [scroll.shouldPreload, preloadNext]);

  // === Current Chapter Info ===
  const currentChapter = useMemo(() => {
    if (chapters.length === 0) return null;
    let pageCount = 0;
    for (const ch of chapters) {
      if (scroll.currentPage <= pageCount + ch.pages.length) return ch;
      pageCount += ch.pages.length;
    }
    return chapters[chapters.length - 1];
  }, [chapters, scroll.currentPage]);

  // === Loaded Chapter IDs ===
  const loadedChapterIds = useMemo(
    () => new Set(chapters.map((ch) => ch.id)),
    [chapters]
  );

  // === Handlers ===
  const handleCenterClick = useCallback(() => {
    ui.toggleUI();
    ui.closeAllPanels();
  }, [ui]);

  // Comments drawer
  const [commentsOpen, setCommentsOpen] = useState(false);
  const handleToggleComments = useCallback(() => setCommentsOpen(v => !v), []);

  // === Loading State ===
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-10 h-10 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Завантаження...</p>
        </div>
      </div>
    );
  }

  // === Error State ===
  if (error || !manhwa) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 text-white">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">
            ❌ {error?.message || 'Манхву не знайдено'}
          </p>
          <Link 
            href="/" 
            className="text-blue-500 hover:text-blue-400 transition-colors"
          >
            ← На головну
          </Link>
        </div>
      </div>
    );
  }

  // === Render ===
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      <ReaderHeader
        title={manhwa.title}
        chapterNumber={currentChapter?.chapterNumber}
        manhwaId={manhwaId}
        visible={ui.showUI}
      />

      <ReaderLayout
        brightness={ui.brightness}
        showUI={ui.showUI}
        widthMode={ui.widthMode}
        contentRef={scroll.contentRef}
        onCenterClick={handleCenterClick}
        onLeftClick={scroll.scrollPrev}
        onRightClick={scroll.scrollNext}
      >
        <ReaderContent 
          chapters={chapters} 
          registerPage={scroll.registerPage} 
        />
      </ReaderLayout>

      <ReaderFooter
        currentPage={scroll.currentPage}
        totalPages={scroll.totalPages}
        progress={scroll.progress}
        visible={ui.showUI}
        onToggleChapterList={ui.toggleChapterList}
        onToggleSettings={ui.toggleSettings}
        onToggleComments={handleToggleComments}
        onToggleAutoScroll={ui.toggleAutoScroll}
        onScrollPrev={scroll.scrollPrev}
        onScrollNext={scroll.scrollNext}
        autoScrollActive={ui.autoScroll}
      />

      <ChapterCommentsComponent
        manhwaId={manhwaId}
        chapterId={currentChapter?.id ?? chapterId}
        mode="drawer"
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />

      <ReaderSettingsPanel
        visible={ui.showUI && ui.showSettings}
        brightness={ui.brightness}
        widthMode={ui.widthMode}
        isFullscreen={ui.isFullscreen}
        autoScrollSpeed={ui.autoScrollSpeed}
        autoScrollActive={ui.autoScroll}
        onBrightnessChange={ui.setBrightness}
        onReset={ui.resetBrightness}
        onWidthModeChange={ui.setWidthMode}
        onToggleFullscreen={ui.toggleFullscreen}
        onAutoScrollSpeedChange={ui.setAutoScrollSpeed}
        onToggleAutoScroll={ui.toggleAutoScroll}
      />

      <ReaderChapterList
        visible={ui.showUI && ui.showChapterList}
        chapters={manhwa.chapters}
        loadedChapterIds={loadedChapterIds}
        manhwaId={manhwaId}
      />
    </div>
  );
}