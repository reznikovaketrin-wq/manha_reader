/**
 * React Query хуки для прогресса чтения
 * 
 * Queries - получение данных с кешированием
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/app/providers/UserProvider';
import {
  ReadingProgress,
  readingProgressKeys,
  READING_PROGRESS_CONFIG,
} from './types';
import {
  fetchProgress,
  fetchRecentProgress,
  fetchAllProgress,
  getLocalProgress,
  getLocalRecentProgress,
  getLocalStorageProgress,
} from './api';

// ============================================
// useReadingProgress
// ============================================

interface UseReadingProgressOptions {
  /** Отключить запрос */
  enabled?: boolean;
}

/**
 * Хук для получения прогресса чтения конкретной манхвы
 * 
 * Автоматически определяет источник данных:
 * - Supabase для авторизованных
 * - localStorage для гостей
 * 
 * @example
 * const { data: progress, isLoading } = useReadingProgress('manhwa-123');
 * 
 * // Получить последнюю прочитанную главу
 * const lastChapterId = progress?.currentChapterId;
 * 
 * // Проверить прочитана ли глава
 * const isRead = progress?.readChapterIds.includes(chapterId);
 */
export function useReadingProgress(
  manhwaId: string,
  options: UseReadingProgressOptions = {}
) {
  const { user } = useUser();
  const { enabled = true } = options;

  // Диагностические логи для отладки состояния пользователя
  if (process.env.NODE_ENV !== 'production') {
    console.log('[useReadingProgress] Hook State:', {
      manhwaId,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      enabled,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  return useQuery({
    queryKey: readingProgressKeys.progress(manhwaId, user?.id), // Добавляем userId в ключ!
    queryFn: async (): Promise<ReadingProgress | null> => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[useReadingProgress] Starting queryFn:', {
          manhwaId,
          hasUser: !!user,
          userId: user?.id
        });
      }
      
      let progress: ReadingProgress | null = null;
      
      if (user?.id) {
        // Авторизованный пользователь - Supabase
        console.log('[useReadingProgress] Fetching from Supabase for user:', user.id);
        progress = await fetchProgress(user.id, manhwaId);
        console.log('[useReadingProgress] Supabase result:', progress);
      } else {
        // Гость - localStorage
        console.log('[useReadingProgress] Fetching from localStorage');
        progress = getLocalProgress(manhwaId);
        console.log('[useReadingProgress] localStorage result:', progress);
      }
      
      // Если прогресс есть, исправляем проблемы
      if (progress) {
        // Убираем дубликаты из readChapterIds
        const originalIds = progress.readChapterIds;
        progress.readChapterIds = [...new Set(progress.readChapterIds)];
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('[useReadingProgress] Progress processed:', {
            originalIds,
            processedIds: progress.readChapterIds,
            currentChapterId: progress.currentChapterId
          });
        }
      }
      
      return progress;
    },
    enabled: enabled && !!manhwaId,
    staleTime: 2 * 60 * 1000, // 2 минуты
    refetchOnWindowFocus: false, // Не перезапрашиваем при фокусе окна
  });
}

// ============================================
// useContinueReading
// ============================================

interface UseContinueReadingOptions {
  /** Лимит элементов */
  limit?: number;
  /** Отключить запрос */
  enabled?: boolean;
}

/**
 * Хук для получения списка "Продовжити читання"
 * 
 * @example
 * const { data: items, isLoading } = useContinueReading({ limit: 8 });
 */
export function useContinueReading(options: UseContinueReadingOptions = {}) {
  const { user } = useUser();
  const { 
    limit = READING_PROGRESS_CONFIG.CONTINUE_READING_LIMIT, 
    enabled = true 
  } = options;

  return useQuery({
    queryKey: readingProgressKeys.continueReading(user?.id),
    queryFn: async (): Promise<ReadingProgress[]> => {
      if (user?.id) {
        return await fetchRecentProgress(user.id, limit);
      } else {
        return getLocalRecentProgress(limit);
      }
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 минуты
    refetchOnWindowFocus: false, // Не перезапрашиваем при фокусе окна
  });
}

// ============================================
// useReadingHistory
// ============================================

interface UseReadingHistoryOptions {
  /** Отключить запрос */
  enabled?: boolean;
}

/**
 * Хук для получения полной истории чтения
 * 
 * @example
 * const { data: history, isLoading } = useReadingHistory();
 */
export function useReadingHistory(options: UseReadingHistoryOptions = {}) {
  const { user } = useUser();
  const { enabled = true } = options;

  return useQuery({
    queryKey: readingProgressKeys.history(user?.id),
    queryFn: async (): Promise<ReadingProgress[]> => {
      if (user?.id) {
        return await fetchAllProgress(user.id);
      } else {
        const all = getLocalStorageProgress();
        return Object.values(all).sort(
          (a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
        );
      }
    },
    enabled,
    staleTime: 60 * 1000, // 1 минута
  });
}

// ============================================
// useIsChapterRead
// ============================================

/**
 * Хук для проверки прочитана ли глава
 * 
 * Использует данные из useReadingProgress
 * 
 * @example
 * const isRead = useIsChapterRead('manhwa-123', 'chapter-456');
 */
export function useIsChapterRead(manhwaId: string, chapterId: string): boolean {
  const { data: progress } = useReadingProgress(manhwaId);
  
  if (!progress) return false;
  
  return progress.readChapterIds.includes(chapterId);
}

// ============================================
// useReadChaptersSet
// ============================================

/**
 * Хук для получения Set прочитанных глав
 * 
 * Удобно для проверки множества глав
 * 
 * @example
 * const readChapters = useReadChaptersSet('manhwa-123');
 * const isRead = readChapters.has(chapterId);
 */
export function useReadChaptersSet(manhwaId: string): Set<string> {
  const { data: progress } = useReadingProgress(manhwaId);
  
  if (!progress) return new Set();
  
  return new Set(progress.readChapterIds);
}
