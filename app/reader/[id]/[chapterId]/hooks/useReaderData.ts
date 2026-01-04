import { useState, useCallback, useMemo, useRef } from 'react';
import type { Manhwa, ChapterData, UseReaderDataReturn } from '../types';

interface UseReaderDataConfig {
  manhwaId: string;
  initialChapterId: string;
}

/**
 * useReaderData - Data layer for reader
 * 
 * Responsibilities:
 * - Load manhwa metadata
 * - Load chapters by id
 * - Maintain ordered chapter buffer
 * - Preload next chapter
 * - Deduplicate requests
 */
export function useReaderData({
  manhwaId,
  initialChapterId,
}: UseReaderDataConfig): UseReaderDataReturn {
  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track loading states to prevent duplicate requests
  const loadingChapters = useRef(new Set<string>());
  const loadedChapters = useRef(new Set<string>());

  // Parse page URLs from API response
  const parsePages = useCallback((pages: unknown[]): string[] => {
    return pages.map((p) =>
      typeof p === 'string' ? p : (p as { imageUrl: string }).imageUrl
    );
  }, []);

  // Load manhwa metadata
  const loadManhwa = useCallback(async (): Promise<Manhwa | null> => {
    try {
      const response = await fetch(`/api/public/${manhwaId}`);
      if (!response.ok) {
        throw new Error(`Failed to load manhwa: ${response.status}`);
      }
      const data = await response.json();
      setManhwa(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return null;
    }
  }, [manhwaId]);

  // Load single chapter (idempotent)
  const loadChapter = useCallback(
    async (chapterId: string): Promise<void> => {
      // Skip if already loaded or loading
      if (loadedChapters.current.has(chapterId) || loadingChapters.current.has(chapterId)) {
        return;
      }

      loadingChapters.current.add(chapterId);

      try {
        const response = await fetch(`/api/public/${manhwaId}/chapters/${chapterId}`);

        if (!response.ok) {
          throw new Error(`Failed to load chapter: ${response.status}`);
        }

        const data = await response.json();
        const chapterData: ChapterData = {
          id: data.id,
          chapterNumber: data.chapterNumber,
          title: data.title,
          pages: parsePages(data.pages || []),
        };

        setChapters((prev) => {
          // Maintain order by chapter number
          const exists = prev.some((ch) => ch.id === chapterId);
          if (exists) return prev;

          const updated = [...prev, chapterData];
          updated.sort((a, b) => a.chapterNumber - b.chapterNumber);
          return updated;
        });

        loadedChapters.current.add(chapterId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        loadingChapters.current.delete(chapterId);
      }
    },
    [manhwaId, parsePages]
  );

  // Get current chapter index in manhwa.chapters
  const getChapterIndex = useCallback(
    (chapterId: string): number => {
      if (!manhwa) return -1;
      return manhwa.chapters.findIndex((ch) => ch.id === chapterId);
    },
    [manhwa]
  );

  // Get last loaded chapter
  const lastLoadedChapter = useMemo(() => {
    return chapters.length > 0 ? chapters[chapters.length - 1] : null;
  }, [chapters]);

  // Navigation metadata
  const navigationMeta = useMemo(() => {
    if (!manhwa || !lastLoadedChapter) {
      return {
        currentChapterMeta: null,
        nextChapterMeta: null,
        prevChapterMeta: null,
        hasNext: false,
        hasPrev: false,
      };
    }

    const currentIndex = manhwa.chapters.findIndex(
      (ch) => ch.id === lastLoadedChapter.id
    );

    return {
      currentChapterMeta: manhwa.chapters[currentIndex] ?? null,
      nextChapterMeta: manhwa.chapters[currentIndex + 1] ?? null,
      prevChapterMeta: manhwa.chapters[currentIndex - 1] ?? null,
      hasNext: currentIndex < manhwa.chapters.length - 1,
      hasPrev: currentIndex > 0,
    };
  }, [manhwa, lastLoadedChapter]);

  // Preload next chapter
  const preloadNext = useCallback(() => {
    if (navigationMeta.nextChapterMeta) {
      loadChapter(navigationMeta.nextChapterMeta.id);
    }
  }, [navigationMeta.nextChapterMeta, loadChapter]);

  // Initial load effect is handled by the parent component
  // to maintain "no implicit fetching via useEffect in UI" rule

  return {
    manhwa,
    chapters,
    isLoading,
    error,
    loadChapter,
    preloadNext,
    getChapterIndex,
    ...navigationMeta,

    // Exposed for initial load
    _loadManhwa: loadManhwa,
    _setIsLoading: setIsLoading,
  } as UseReaderDataReturn & {
    _loadManhwa: () => Promise<Manhwa | null>;
    _setIsLoading: (v: boolean) => void;
  };
}

export type { UseReaderDataConfig };
