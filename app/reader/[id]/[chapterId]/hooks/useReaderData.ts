import { useState, useCallback, useMemo, useRef } from 'react';
import type { Manhwa, ChapterData, UseReaderDataReturn } from '../types';
import { supabase } from '@/lib/supabase-client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UseReaderDataConfig {
  manhwaId: string;
  initialChapterId: string;
  user?: SupabaseUser | null;
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
 * - Skip VIP chapters for non-VIP users during preload
 */
export function useReaderData({
  manhwaId,
  initialChapterId,
  user,
}: UseReaderDataConfig): UseReaderDataReturn {
  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track loading states to prevent duplicate requests
  const loadingChapters = useRef(new Set<string>());
  const loadedChapters = useRef(new Set<string>());

  // Get user role for VIP access check
  const getUserRole = useCallback(async (): Promise<string> => {
    if (!user?.id) return 'user';
    
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      return userData?.role || 'user';
    } catch (e) {
      return 'user';
    }
  }, [user]);

  // Check if chapter is accessible for current user
  const canAccessChapter = useCallback(async (chapterMeta: any): Promise<boolean> => {
    // If no VIP restrictions, always accessible
    if (!chapterMeta.vipOnly && !chapterMeta.vipEarlyDays) {
      return true;
    }

    const userRole = await getUserRole();
    
    // VIP and admin always have access
    if (userRole === 'vip' || userRole === 'admin') {
      return true;
    }

    // VIP-only chapters blocked for regular users
    if (chapterMeta.vipOnly) {
      return false;
    }

    // Early access check
    if (chapterMeta.vipEarlyDays > 0 && chapterMeta.publicAvailableAt) {
      const now = new Date();
      const availableDate = new Date(chapterMeta.publicAvailableAt);
      
      // If still in early access period, blocked for regular users
      if (now < availableDate) {
        return false;
      }
    }

    return true;
  }, [getUserRole]);
  
  // Get auth headers
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`
      };
    }
    
    return {};
  }, []);

  // Parse page URLs from API response
  const parsePages = useCallback((pages: unknown[]): string[] => {
    return pages.map((p) =>
      typeof p === 'string' ? p : (p as { imageUrl: string }).imageUrl
    );
  }, []);

  // Load manhwa metadata
  const loadManhwa = useCallback(async (): Promise<Manhwa | null> => {
    try {
      const headers = await getAuthHeaders();
      const formattedHeaders = Object.fromEntries(Object.entries(headers).filter(([key, value]) => value !== undefined));
      const response = await fetch(`/api/public/${manhwaId}`, { headers: new Headers(formattedHeaders) });
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
  }, [manhwaId, getAuthHeaders]);

  // Load single chapter (idempotent)
  const loadChapter = useCallback(
    async (chapterId: string): Promise<ChapterData | null> => {
      // Skip if already loaded or loading
      if (loadedChapters.current.has(chapterId) || loadingChapters.current.has(chapterId)) {
        console.log(`[ReaderData] Chapter ${chapterId} already loaded/loading, skipping`);
        return null;
      }

      const startTime = Date.now();
      console.log(`[ReaderData] Loading chapter ${chapterId}...`);
      loadingChapters.current.add(chapterId);

      try {
        const headers = await getAuthHeaders();
        const formattedHeaders = Object.fromEntries(Object.entries(headers).filter(([key, value]) => value !== undefined));
        const response = await fetch(`/api/public/${manhwaId}/chapters/${chapterId}`, { headers: new Headers(formattedHeaders) });

        if (!response.ok) {
          // Обработка ошибок VIP доступа
          if (response.status === 403) {
            const errorData = await response.json();
            if (errorData.error === 'VIP_ONLY') {
              throw new Error('Цей розділ доступний тільки для VIP користувачів. Оновіть свою підписку для доступу до ексклюзивного контенту.');
            } else if (errorData.error === 'EARLY_ACCESS') {
              const availableDate = new Date(errorData.availableAt);
              const dateStr = availableDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
              const timeStr = availableDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
              throw new Error(`Цей розділ буде доступний для всіх користувачів ${dateStr} о ${timeStr}. VIP користувачі мають ранній доступ.`);
            }
          }
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
        const elapsed = Date.now() - startTime;
        console.log(`[ReaderData] ✓ Chapter ${chapterId} loaded in ${elapsed}ms (${chapterData.pages.length} pages)`);
        return chapterData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        const elapsed = Date.now() - startTime;
        console.error(`[ReaderData] ✗ Failed to load chapter ${chapterId} after ${elapsed}ms:`, error);
        setError(error);
        return null;
      } finally {
        loadingChapters.current.delete(chapterId);
      }
    },
    [manhwaId, parsePages, getAuthHeaders]
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

  // Preload next chapter (only if user has access)
  const preloadNext = useCallback(async () => {
    if (!navigationMeta.nextChapterMeta) return;
    
    // Check if user can access the next chapter
    const hasAccess = await canAccessChapter(navigationMeta.nextChapterMeta);
    
    if (hasAccess) {
      loadChapter(navigationMeta.nextChapterMeta.id);
    } else {
      console.log(`[ReaderData] Skipping preload of VIP chapter: ${navigationMeta.nextChapterMeta.id}`);
    }
  }, [navigationMeta.nextChapterMeta, loadChapter, canAccessChapter]);

  // Clear all chapters and load a single one (for non-infinite scroll mode)
  const clearAndLoadChapter = useCallback(
    async (chapterId: string): Promise<void> => {
      // Clear existing chapters
      setChapters([]);
      loadedChapters.current.clear();
      
      // Load new chapter
      await loadChapter(chapterId);
    },
    [loadChapter]
  );

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
    clearAndLoadChapter,
    ...navigationMeta,

    // Exposed for initial load
    _loadManhwa: loadManhwa,
    _setIsLoading: setIsLoading,
  } as UseReaderDataReturn & {
    _loadManhwa: () => Promise<Manhwa | null>;
    _setIsLoading: (v: boolean) => void;
    clearAndLoadChapter: (chapterId: string) => Promise<void>;
  };
}

export type { UseReaderDataConfig };
