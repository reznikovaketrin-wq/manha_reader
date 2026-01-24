import { useEffect, useRef, useCallback } from 'react';
import { useSaveProgress, saveLocalProgress, LOCAL_STORAGE_KEY } from '@/lib/reading-progress';
import type { ChapterData } from '../types';

interface UseReadingProgressConfig {
  manhwaId: string;
  chapters: ChapterData[];
  currentPage: number;
  debounceMs?: number;
  debug?: boolean;
}

interface ChapterInfo {
  chapterId: string;
  chapterNumber: number;
  pageInChapter: number;
}

/**
 * useReadingProgress - зберігає прогрес читання
 * 
 * Використовує React Query мутацію для автоматичного вибору джерела:
 * - Supabase для авторизованих користувачів
 * - localStorage для гостей
 * 
 * Debouncing запобігає спаму запитів
 */
export function useReaderProgress({
  manhwaId,
  chapters,
  currentPage,
  debounceMs = 2000,
  debug = false,
}: UseReadingProgressConfig): void {
  const { mutate: saveProgress } = useSaveProgress();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Визначити поточну главу та сторінку в главі
  const getCurrentChapterInfo = useCallback((): ChapterInfo | null => {
    if (chapters.length === 0) return null;

    let pageCount = 0;

    for (const chapter of chapters) {
      const chapterPages = chapter.pages.length;
      const nextPageCount = pageCount + chapterPages;

      if (currentPage <= nextPageCount) {
        return {
          chapterId: chapter.id,
          chapterNumber: chapter.chapterNumber,
          pageInChapter: Math.max(1, currentPage - pageCount),
        };
      }

      pageCount = nextPageCount;
    }

    // Fallback на останню главу
    const lastChapter = chapters[chapters.length - 1];
    return {
      chapterId: lastChapter.id,
      chapterNumber: lastChapter.chapterNumber,
      pageInChapter: lastChapter.pages.length,
    };
  }, [chapters, currentPage]);

  // Основна логіка збереження прогресу
  useEffect(() => {
    if (!manhwaId || chapters.length === 0 || currentPage < 1) {
      if (debug) {
        console.log('[useReadingProgress] Skip - not ready:', {
          manhwaId: !!manhwaId,
          chaptersCount: chapters.length,
          currentPage,
        });
      }
      return;
    }

    const chapterInfo = getCurrentChapterInfo();
    if (!chapterInfo) {
      if (debug) console.log('[useReadingProgress] Skip - no chapter info');
      return;
    }

    const saveKey = `${manhwaId}-${chapterInfo.chapterId}-${chapterInfo.pageInChapter}`;
    
    if (lastSavedRef.current === saveKey) {
      if (debug) console.log('[useReadingProgress] Skip - already saved:', saveKey);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (debug) {
      console.log('[useReadingProgress] Scheduling save:', {
        manhwaId,
        chapterId: chapterInfo.chapterId,
        chapterNumber: chapterInfo.chapterNumber,
        pageInChapter: chapterInfo.pageInChapter,
        debounceMs,
      });
    }

    // Debounced save
    timeoutRef.current = setTimeout(async () => {
      try {
        saveProgress({
          manhwaId,
          chapterId: chapterInfo.chapterId,
          chapterNumber: chapterInfo.chapterNumber,
          pageNumber: chapterInfo.pageInChapter,
        });
        
        lastSavedRef.current = saveKey;
        
        if (debug) {
          console.log('[useReaderProgress] ✅ Saved:', {
            manhwaId,
            chapterId: chapterInfo.chapterId,
            page: chapterInfo.pageInChapter,
          });
        }
      } catch (error) {
        console.error('[useReaderProgress] ❌ Error saving:', error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [manhwaId, chapters, currentPage, debounceMs, debug, getCurrentChapterInfo]);

  // Збереження при закритті сторінки
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const chapterInfo = getCurrentChapterInfo();
      if (!chapterInfo || !manhwaId) return;

      try {
        // Синхронне збереження в localStorage як fallback
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          const map = stored ? JSON.parse(stored) : {};
          
          map[manhwaId] = {
            manhwaId,
            currentChapterId: chapterInfo.chapterId,
            currentChapterNumber: chapterInfo.chapterNumber,
            currentPage: chapterInfo.pageInChapter,
            readChapterIds: map[manhwaId]?.readChapterIds || [],
            archivedRanges: map[manhwaId]?.archivedRanges || [],
            startedAt: map[manhwaId]?.startedAt || new Date().toISOString(),
            lastReadAt: new Date().toISOString(),
          };
          
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
          
          if (debug) console.log('[useReaderProgress] Saved on unload');
        }
      } catch (e) {
        // Ignore errors on unload
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [manhwaId, getCurrentChapterInfo, debug]);
}

export type { UseReadingProgressConfig, ChapterInfo };

// Re-export with old name for backwards compatibility
export { useReaderProgress as useReadingProgress };