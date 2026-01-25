'use client';

import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  useChapterTracking,
} from './hooks';
import { trackManhwaView, upsertReadChapter } from '@/lib/supabase-client';
import { getOrCreateClientId } from '@/lib/client-id';
import { useUser } from '@/app/providers/UserProvider';
import { ChapterCommentsComponent } from '@/components/chapter-comments';

// Components
import {
  ReaderLayout,
  ReaderHeader,
  ReaderFooter,
  ReaderSettingsPanel,
  ReaderChapterList,
  ReaderContent,
  RestoreNotification,
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
  const searchParams = useSearchParams();
  const searchString = searchParams ? searchParams.toString() : '';

  // === User Context ===
  const { user } = useUser();
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // === Data Layer ===
  const readerData = useReaderData({ 
    manhwaId, 
    initialChapterId: chapterId,
    user 
  });
  const { manhwa, chapters, isLoading, error, loadChapter, preloadNext } = readerData;

  // Keep a ref to the latest chapters array so async callbacks can read
  // the current value without relying on a stale closure.
  const chaptersRef = useRef<any[]>([]);
  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);

  // === UI State ===
  const ui = useReaderUI();

  // === Calculate total pages ===
  const totalPages = useMemo(
    () => chapters.reduce((sum, ch) => sum + ch.pages.length, 0),
    [chapters]
  );

  // === Scroll Tracking ===
  const scroll = useReaderScroll({ totalPages });

  // === Chapter Tracking & Smart Preload ===
  const currentChapterInfo = useChapterTracking({
    chapters,
    currentPage: scroll.currentPage,
    infiniteScroll: ui.infiniteScroll,
    onShouldPreloadNext: preloadNext,
  });

  // === Check if next chapter is VIP-only ===
  const nextChapterIsVip = useMemo(() => {
    if (!readerData.nextChapterMeta) return false;
    
    const nextMeta = readerData.nextChapterMeta;
    
    // VIP-only chapters
    if (nextMeta.vipOnly) return true;
    
    // Early access check
    if (nextMeta.vipEarlyDays && nextMeta.vipEarlyDays > 0 && nextMeta.publicAvailableAt) {
      const now = new Date();
      const availableDate = new Date(nextMeta.publicAvailableAt);
      return now < availableDate;
    }
    
    return false;
  }, [readerData.nextChapterMeta]);

  // === Footer Display: Show current chapter progress ===
  const footerData = useMemo(() => {
    if (!currentChapterInfo) {
      return {
        currentPage: scroll.currentPage,
        totalPages: scroll.totalPages,
        progress: scroll.progress,
      };
    }

    const { chapter, startPage, progressInChapter } = currentChapterInfo;
    const pageInChapter = scroll.currentPage - startPage + 1;
    const totalPagesInChapter = chapter.pages.length;

    return {
      currentPage: pageInChapter,
      totalPages: totalPagesInChapter,
      progress: progressInChapter,
    };
  }, [currentChapterInfo, scroll.currentPage, scroll.totalPages, scroll.progress]);

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
    const pageParam = searchParams?.get('page');
    const initialPage = pageParam ? parseInt(pageParam, 10) : null;

    const init = async () => {
      const data = await (readerData as any)._loadManhwa();
      if (data) {
        // If user opened with explicit ?page=N, prefer that over any saved
        // progress in localStorage to avoid unexpected jumps caused by
        // merging stored progress during initialization.
        if (initialPage && typeof window !== 'undefined') {
          try {
            const key = 'triw_reading_history';
            const stored = localStorage.getItem(key);
            if (stored) {
              const map = JSON.parse(stored || '{}');
              if (map && map[manhwaId]) {
                // mark session override so we can observe behavior without
                // permanently deleting user's stored history in case this
                // causes unexpected data loss during testing.
                sessionStorage.setItem(`triw_override_progress_${manhwaId}`, '1');
                delete map[manhwaId];
                localStorage.setItem(key, JSON.stringify(map));
              }
            }
          } catch (e) {
            // ignore
          }
        }
        const loadedChapter = await loadChapter(chapterId);
        (readerData as any)._setIsLoading(false);

        // Track view with engagement guard to avoid inflated counts.
        try {
          if (typeof window !== 'undefined') {
            const SESSION_FLAG = `viewed_${manhwaId}_${chapterId}`;
            const SESSION_CONFIRMED = `${SESSION_FLAG}_confirmed`;
            const ENGAGEMENT_THRESHOLD_MS = 7000; // recommended 7s
            const HEARTBEAT_MS = 15000; // optional heartbeat after engagement

            const confirmView = () => {
              const currentUser = userRef.current;
              
              try {
                if (sessionStorage.getItem(SESSION_CONFIRMED)) return;
                sessionStorage.setItem(SESSION_CONFIRMED, '1');

                // Determine id to pass to server: prefer authenticated user id, otherwise client cookie id
                const idForServer = (currentUser && currentUser.id) ? currentUser.id : getOrCreateClientId();

                // Fire-and-forget server tracking — include user/client id and chapter id when available
                trackManhwaView(manhwaId, chapterId, idForServer)
                  .catch((err) => console.warn('[ReaderPage] trackManhwaView failed', err));

                // Track read chapter for authenticated users
                if (currentUser && currentUser.id) {
                  // Get chapter number from current chapter or chapters list
                  const currentChapterData = chaptersRef.current?.find((ch: any) => String(ch.id) === String(chapterId));
                  const chapterNumber = currentChapterData?.chapterNumber || currentChapterData?.number || 0;
                  
                  if (chapterNumber > 0) {
                    upsertReadChapter(currentUser.id, manhwaId, chapterId, chapterNumber)
                      .catch((err) => console.warn('[ReaderPage] upsertReadChapter failed', err));
                  }
                }

                // Optional heartbeat: if user remains, send another server ping after HEARTBEAT_MS
                setTimeout(() => {
                  try {
                    if (sessionStorage.getItem(SESSION_CONFIRMED)) {
                      const currentUserForHeartbeat = userRef.current;
                      const idForHeartbeat = (currentUserForHeartbeat && currentUserForHeartbeat.id) ? currentUserForHeartbeat.id : getOrCreateClientId();
                      trackManhwaView(manhwaId, chapterId, idForHeartbeat).catch(() => {});
                    }
                  } catch (e) {}
                }, HEARTBEAT_MS);
              } catch (e) {
                /* noop */
              }
            };

            if (!sessionStorage.getItem(SESSION_FLAG)) {
              sessionStorage.setItem(SESSION_FLAG, '1');

              // Start engagement timer
              const engagementTimer = setTimeout(() => {
                confirmView();
                removeListeners();
              }, ENGAGEMENT_THRESHOLD_MS);

              // Engagement detection: confirm view on scroll-depth >=30% or key navigation (ArrowRight/PageDown)
              const contentEl = scroll.contentRef?.current;

              const getScrollPercent = () => {
                try {
                  if (!contentEl) return 0;
                  const scrollTop = contentEl.scrollTop || 0;
                  const height = contentEl.scrollHeight - (contentEl.clientHeight || 0);
                  if (height <= 0) return 0;
                  return scrollTop / height;
                } catch (e) {
                  return 0;
                }
              };

              const onKeyNav = (e: KeyboardEvent) => {
                if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                  confirmView();
                  clearTimeout(engagementTimer);
                  removeListeners();
                }
              };

              const onScroll = () => {
                if (getScrollPercent() >= 0.3) {
                  confirmView();
                  clearTimeout(engagementTimer);
                  removeListeners();
                }
              };

              const removeListeners = () => {
                try {
                  window.removeEventListener('keydown', onKeyNav as any);
                  if (contentEl) contentEl.removeEventListener('scroll', onScroll as any);
                } catch (e) {}
              };

              window.addEventListener('keydown', onKeyNav as any, { passive: true });
              if (contentEl) contentEl.addEventListener('scroll', onScroll as any, { passive: true });
            } else {
              if (!sessionStorage.getItem(SESSION_CONFIRMED)) {
                setTimeout(() => {
                  try { confirmView(); } catch (e) {}
                }, 1000);
              }
            }
          }
        } catch (e) {
          // don't let tracking break the reader
        }

        // If we have a target page, compute absolute page using the freshly
        // loaded chapters (from readerData) and attempt a single, deterministic
        // wait+scroll. Relying on the `chapters` variable captured by the effect
        // caused the lookup to miss updates in this closure.
        if (initialPage && initialPage > 0) {
          const start = Date.now();
          const timeout = 3000; // ms

          // Prefer computing offset from manhwa metadata (synchronous after loadManhwa)
          const manhwaMeta = (readerData as any).manhwa;
          let computed = false;

          if (manhwaMeta && Array.isArray(manhwaMeta.chapters)) {
            const idxMeta = manhwaMeta.chapters.findIndex((ch: any) => String(ch.id) === String(chapterId));
            if (idxMeta >= 0) {
              let pageOffset = 0;
              for (let i = 0; i < idxMeta; i++) pageOffset += manhwaMeta.chapters[i].pagesCount || 0;
              const absolutePage = pageOffset + initialPage;

              console.log(`[ReaderPage] (from manhwa meta) Target: relative page ${initialPage}, absolute page ${absolutePage}, pageOffset=${pageOffset}, chapterIndex=${idxMeta}`);

              const result = await scroll.waitForAndScroll(absolutePage, timeout);
              computed = true;

              if (result.success) {
                console.log(`[ReaderPage] ✓ Successfully restored to page ${initialPage} (${result.reason}, ${result.elapsedMs}ms)`);
              } else {
                console.warn(`[ReaderPage] ✗ Failed to restore page ${initialPage}: ${result.reason}`);
                setRestoreState({ show: true, targetPage: initialPage, absolutePage });
              }
            }
          }

          if (!computed) {
            // Fallback: wait for chaptersRef to update
            const startWait = Date.now();
            let idx = -1;
            while (Date.now() - startWait < timeout) {
              const loadedChapters = chaptersRef.current || [];
              idx = loadedChapters.findIndex((ch: any) => String(ch.id) === String(chapterId));
              if (idx >= 0) break;
              // eslint-disable-next-line no-await-in-loop
              await new Promise((r) => setTimeout(r, 50));
            }

            if (idx >= 0) {
              const loadedChapters = chaptersRef.current || [];
              let pageOffset = 0;
              for (let i = 0; i < idx; i++) pageOffset += loadedChapters[i].pages.length;
              const absolutePage = pageOffset + initialPage;

              console.log(`[ReaderPage] (from loaded chapters) Target: relative page ${initialPage}, absolute page ${absolutePage}, pageOffset=${pageOffset}, chapterIndex=${idx}`);

              const result = await scroll.waitForAndScroll(absolutePage, timeout - (Date.now() - startWait));

              if (result.success) {
                console.log(`[ReaderPage] ✓ Successfully restored to page ${initialPage} (${result.reason}, ${result.elapsedMs}ms)`);
              } else {
                console.warn(`[ReaderPage] ✗ Failed to restore page ${initialPage}: ${result.reason}`);
                setRestoreState({ show: true, targetPage: initialPage, absolutePage });
              }
            } else {
              console.warn(`[ReaderPage] ✗ Chapter ${chapterId} not found in loaded chapters after waiting ${timeout}ms`);
            }
          }
        }
      }
    };
    init();
    // Re-run init when search params change (e.g., client-side navigation with ?page=N)
  }, [manhwaId, chapterId, searchString]);

  // Note: Preload is now handled by useChapterTracking hook
  // It triggers preloadNext() when user reaches 90% of CURRENT chapter

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

  // When user disables infinite scroll, switch to non-infinite mode immediately
  // by clearing the buffer and loading only the currently viewed chapter.
  // Run only when the flag transitions from true -> false to avoid loops.
  useEffect(() => {
    const prevRef = (useEffect as any)._prevInfiniteRef as { current?: boolean } | undefined;
    // lazily attach a stable ref on the module to avoid adding another hook
    if (!prevRef) {
      (useEffect as any)._prevInfiniteRef = { current: ui.infiniteScroll };
    }

    const prev = (useEffect as any)._prevInfiniteRef.current;
    // update stored previous value for next run
    (useEffect as any)._prevInfiniteRef.current = ui.infiniteScroll;

    // Only act when we transitioned from true -> false
    if (prev !== true || ui.infiniteScroll !== false) return;

    const targetChapterId = currentChapter?.id ?? chapterId;
    if (!targetChapterId) return;

    let cancelled = false;

    (async () => {
      try {
        if (cancelled) return;
        // clear existing chapters and load only the current one
        await (readerData as any).clearAndLoadChapter(targetChapterId);
        if (cancelled) return;
        // small delay to allow DOM updates, then scroll to top of the new content
        setTimeout(() => scroll.scrollToTop(), 50);
      } catch (e) {
        // don't break the reader if something fails
        // eslint-disable-next-line no-console
        console.warn('[ReaderPage] Failed to apply non-infinite mode', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ui.infiniteScroll, currentChapter?.id, chapterId]);

  // === Handlers ===
  const handleCenterClick = useCallback(() => {
    ui.toggleUI();
    ui.closeAllPanels();
  }, [ui]);

  // Chapter navigation (footer buttons should change chapters)
  const handlePrevChapter = useCallback(async () => {
    if (!readerData.prevChapterMeta) return;
    
    if (ui.infiniteScroll) {
      // Infinite scroll mode: if chapter exists, scroll to it; otherwise load first
      const existingChapter = chapters.find(ch => ch.id === readerData.prevChapterMeta!.id);
      
      if (existingChapter) {
        // Chapter already loaded, just scroll to its first page
        let pageOffset = 0;
        for (const ch of chapters) {
          if (ch.id === readerData.prevChapterMeta!.id) {
            const result = await scroll.waitForAndScroll(pageOffset + 1, 2000);
            if (!result.success) {
              console.warn(`[ReaderPage] Failed to scroll to prev chapter: ${result.reason}`);
            }
            return;
          }
          pageOffset += ch.pages.length;
        }
      } else {
        // Load and scroll
        await loadChapter(readerData.prevChapterMeta.id);
        setTimeout(() => scroll.scrollToTop(), 100);
      }
    } else {
      // Non-infinite mode: clear and load only this chapter
      await (readerData as any).clearAndLoadChapter(readerData.prevChapterMeta.id);
      scroll.scrollToTop();
    }
  }, [readerData, loadChapter, scroll, ui.infiniteScroll, chapters]);

  const handleNextChapter = useCallback(async () => {
    if (!readerData.nextChapterMeta) return;
    
    if (ui.infiniteScroll) {
      // Infinite scroll mode: if chapter exists, scroll to it; otherwise load first
      const existingChapter = chapters.find(ch => ch.id === readerData.nextChapterMeta!.id);
      
      if (existingChapter) {
        // Chapter already loaded, just scroll to its first page
        let pageOffset = 0;
        for (const ch of chapters) {
          if (ch.id === readerData.nextChapterMeta!.id) {
            const result = await scroll.waitForAndScroll(pageOffset + 1, 2000);
            if (!result.success) {
              console.warn(`[ReaderPage] Failed to scroll to next chapter: ${result.reason}`);
            }
            return;
          }
          pageOffset += ch.pages.length;
        }
      } else {
        // Load and scroll
        await loadChapter(readerData.nextChapterMeta.id);
        // Wait for chapter to be added to state before calculating offset
        setTimeout(async () => {
          let pageOffset = 0;
          for (const ch of chapters) {
            if (ch.id === readerData.nextChapterMeta!.id) {
              const result = await scroll.waitForAndScroll(pageOffset + 1, 2000);
              if (!result.success) {
                console.warn(`[ReaderPage] Failed to scroll to loaded next chapter: ${result.reason}`);
              }
              return;
            }
            pageOffset += ch.pages.length;
          }
        }, 100);
      }
    } else {
      // Non-infinite mode: clear and load only this chapter
      await (readerData as any).clearAndLoadChapter(readerData.nextChapterMeta.id);
      scroll.scrollToTop();
    }
  }, [readerData, loadChapter, scroll, ui.infiniteScroll, chapters]);

  // Comments drawer
  const [commentsOpen, setCommentsOpen] = useState(false);
  const handleToggleComments = useCallback(() => setCommentsOpen(v => !v), []);

  // Restore notification state
  const [restoreState, setRestoreState] = useState<{
    show: boolean;
    targetPage: number;
    absolutePage: number;
  }>({ show: false, targetPage: 0, absolutePage: 0 });

  const handleRetryRestore = useCallback(async () => {
    if (restoreState.absolutePage > 0) {
      console.log(`[ReaderPage] Retrying restore to page ${restoreState.targetPage}...`);
      const result = await scroll.waitForAndScroll(restoreState.absolutePage, 5000);
      if (result.success) {
        console.log(`[ReaderPage] ✓ Retry successful`);
        setRestoreState({ show: false, targetPage: 0, absolutePage: 0 });
      } else {
        console.warn(`[ReaderPage] ✗ Retry failed: ${result.reason}`);
      }
    }
  }, [restoreState, scroll]);

  const handleDismissRestore = useCallback(() => {
    setRestoreState({ show: false, targetPage: 0, absolutePage: 0 });
  }, []);

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
    const isVipError = error?.message?.includes('VIP користувачів') || error?.message?.includes('ранній доступ');
    
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 text-white p-6">
        <div className="text-center max-w-md">
          {isVipError && (
            <div className="text-6xl mb-4">🔒</div>
          )}
          <p className={`text-lg mb-4 ${isVipError ? 'text-yellow-400' : 'text-red-500'}`}>
            {isVipError ? '⭐' : '❌'} {error?.message || 'Манхву не знайдено'}
          </p>
          {isVipError && (
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-300 mb-2">
                ⭐ Переваги VIP підписки:
              </p>
              <ul className="text-xs text-gray-400 text-left list-disc list-inside">
                <li>Ранній доступ до нових розділів</li>
                <li>Ексклюзивний VIP контент</li>
                <li>Підтримка розвитку сайту</li>
              </ul>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Link 
              href={manhwa ? `/manhwa/${manhwa.id}` : '/'}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ← Назад до манхви
            </Link>
            <Link 
              href="/" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              На головну
            </Link>
          </div>
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
        onToggleSettings={ui.toggleSettings}
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
          infiniteScroll={ui.infiniteScroll}
          manhwaId={manhwaId}
          nextChapterId={readerData.nextChapterMeta?.id}
          prevChapterId={readerData.prevChapterMeta?.id}
          hasNext={readerData.hasNext}
          hasPrev={readerData.hasPrev}
          onLoadPrev={handlePrevChapter}
          onLoadNext={handleNextChapter}
          nextChapterIsVip={nextChapterIsVip}
        />
      </ReaderLayout>

      <ReaderFooter
        currentPage={footerData.currentPage}
        totalPages={footerData.totalPages}
        progress={footerData.progress}
        visible={ui.showUI}
        onToggleChapterList={ui.toggleChapterList}
        onToggleComments={handleToggleComments}
        onToggleAutoScroll={ui.toggleAutoScroll}
        onScrollPrev={handlePrevChapter}
        onScrollNext={handleNextChapter}
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
        infiniteScroll={ui.infiniteScroll}
        onBrightnessChange={ui.setBrightness}
        onReset={ui.resetBrightness}
        onWidthModeChange={ui.setWidthMode}
        onToggleFullscreen={ui.toggleFullscreen}
        onAutoScrollSpeedChange={ui.setAutoScrollSpeed}
        onToggleAutoScroll={ui.toggleAutoScroll}
        onToggleInfiniteScroll={ui.toggleInfiniteScroll}
      />

      <ReaderChapterList
        visible={ui.showUI && ui.showChapterList}
        chapters={manhwa.chapters}
        loadedChapterIds={loadedChapterIds}
        manhwaId={manhwaId}
      />

      <RestoreNotification
        visible={restoreState.show}
        targetPage={restoreState.targetPage}
        onRetry={handleRetryRestore}
        onDismiss={handleDismissRestore}
      />
    </div>
  );
}