/**
 * React Query mutations для прогресса чтения
 * 
 * Mutations с optimistic updates для быстрого UI
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/app/providers/UserProvider';
import {
  ReadingProgress,
  SaveProgressInput,
  readingProgressKeys,
} from './types';
import {
  saveProgress,
  saveLocalProgress,
  markChapterAsRead,
  getLocalProgress,
} from './api';

// ============================================
// useSaveProgress
// ============================================

interface UseSaveProgressOptions {
  /** Callback при успехе */
  onSuccess?: () => void;
  /** Callback при ошибке */
  onError?: (error: Error) => void;
}

/**
 * Хук для сохранения прогресса чтения
 * 
 * С optimistic update - UI обновляется мгновенно
 * 
 * @example
 * const { mutate: save, isPending } = useSaveProgress();
 * 
 * save({
 *   manhwaId: 'manhwa-123',
 *   chapterId: 'chapter-456',
 *   chapterNumber: 10,
 *   pageNumber: 5,
 * });
 */
export function useSaveProgress(options: UseSaveProgressOptions = {}) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (input: SaveProgressInput) => {
      if (user?.id) {
        // Авторизованный - Supabase
        const result = await saveProgress(user.id, input);
        if (!result.success) {
          throw new Error(result.error || 'Failed to save progress');
        }
        return result;
      } else {
        // Гость - localStorage
        const existing = getLocalProgress(input.manhwaId);
        const now = new Date().toISOString();
        
        const progress: ReadingProgress = {
          manhwaId: input.manhwaId,
          currentChapterId: input.chapterId,
          currentChapterNumber: input.chapterNumber,
          currentPage: input.pageNumber,
          readChapterIds: existing?.readChapterIds || [],
          archivedRanges: existing?.archivedRanges || [],
          startedAt: existing?.startedAt || now,
          lastReadAt: now,
        };
        
        // Добавляем главу в прочитанные
        if (!progress.readChapterIds.includes(input.chapterId)) {
          progress.readChapterIds = [...progress.readChapterIds, input.chapterId];
        }
        
        saveLocalProgress(progress);
        return { success: true };
      }
    },
    
    // Optimistic update
    onMutate: async (input) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({ 
        queryKey: readingProgressKeys.progress(input.manhwaId) 
      });
      
      // Сохраняем предыдущее значение
      const previousProgress = queryClient.getQueryData<ReadingProgress | null>(
        readingProgressKeys.progress(input.manhwaId)
      );
      
      // Optimistic update
      const now = new Date().toISOString();
      const optimisticProgress: ReadingProgress = {
        manhwaId: input.manhwaId,
        currentChapterId: input.chapterId,
        currentChapterNumber: input.chapterNumber,
        currentPage: input.pageNumber,
        readChapterIds: previousProgress?.readChapterIds 
          ? [...new Set([...previousProgress.readChapterIds, input.chapterId])]
          : [input.chapterId],
        archivedRanges: previousProgress?.archivedRanges || [],
        startedAt: previousProgress?.startedAt || now,
        lastReadAt: now,
      };
      
      queryClient.setQueryData(
        readingProgressKeys.progress(input.manhwaId),
        optimisticProgress
      );
      
      return { previousProgress };
    },
    
    // Rollback при ошибке
    onError: (error, input, context) => {
      if (context?.previousProgress !== undefined) {
        queryClient.setQueryData(
          readingProgressKeys.progress(input.manhwaId),
          context.previousProgress
        );
      }
      onError?.(error as Error);
    },
    
    // Инвалидируем кеш при успехе
    onSuccess: (_, input) => {
      // Инвалидируем связанные queries
      queryClient.invalidateQueries({ 
        queryKey: readingProgressKeys.continueReading(user?.id) 
      });
      onSuccess?.();
    },
  });
}

// ============================================
// useMarkChapterRead
// ============================================

interface MarkChapterReadInput {
  manhwaId: string;
  chapterId: string;
  chapterNumber: number;
}

interface UseMarkChapterReadOptions {
  /** Callback при успехе */
  onSuccess?: () => void;
  /** Callback при ошибке */
  onError?: (error: Error) => void;
}

/**
 * Хук для отметки главы как прочитанной
 * 
 * @example
 * const { mutate: markRead } = useMarkChapterRead();
 * 
 * markRead({
 *   manhwaId: 'manhwa-123',
 *   chapterId: 'chapter-456',
 *   chapterNumber: 10,
 * });
 */
export function useMarkChapterRead(options: UseMarkChapterReadOptions = {}) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (input: MarkChapterReadInput) => {
      if (user?.id) {
        const result = await markChapterAsRead(
          user.id, 
          input.manhwaId, 
          input.chapterId, 
          input.chapterNumber
        );
        if (!result.success) {
          throw new Error(result.error || 'Failed to mark chapter as read');
        }
        return result;
      } else {
        // Гость - localStorage
        const existing = getLocalProgress(input.manhwaId);
        const now = new Date().toISOString();
        
        const progress: ReadingProgress = {
          manhwaId: input.manhwaId,
          currentChapterId: existing?.currentChapterId || input.chapterId,
          currentChapterNumber: existing?.currentChapterNumber || input.chapterNumber,
          currentPage: existing?.currentPage || 1,
          readChapterIds: existing?.readChapterIds || [],
          archivedRanges: existing?.archivedRanges || [],
          startedAt: existing?.startedAt || now,
          lastReadAt: now,
        };
        
        if (!progress.readChapterIds.includes(input.chapterId)) {
          progress.readChapterIds = [...progress.readChapterIds, input.chapterId];
        }
        
        saveLocalProgress(progress);
        return { success: true };
      }
    },
    
    // Optimistic update
    onMutate: async (input) => {
      await queryClient.cancelQueries({ 
        queryKey: readingProgressKeys.progress(input.manhwaId) 
      });
      
      const previousProgress = queryClient.getQueryData<ReadingProgress | null>(
        readingProgressKeys.progress(input.manhwaId)
      );
      
      if (previousProgress) {
        const optimisticProgress: ReadingProgress = {
          ...previousProgress,
          readChapterIds: [...new Set([...previousProgress.readChapterIds, input.chapterId])],
          lastReadAt: new Date().toISOString(),
        };
        
        queryClient.setQueryData(
          readingProgressKeys.progress(input.manhwaId),
          optimisticProgress
        );
      }
      
      return { previousProgress };
    },
    
    onError: (error, input, context) => {
      if (context?.previousProgress !== undefined) {
        queryClient.setQueryData(
          readingProgressKeys.progress(input.manhwaId),
          context.previousProgress
        );
      }
      onError?.(error as Error);
    },
    
    onSuccess: () => {
      onSuccess?.();
    },
  });
}

// ============================================
// useSyncProgress (для синхронизации при логине)
// ============================================

import { syncLocalToSupabase } from './api';

/**
 * Хук для синхронизации локальных данных при логине
 */
export function useSyncProgress() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return await syncLocalToSupabase(user.id);
    },
    
    onSuccess: () => {
      // Инвалидируем все reading progress queries
      queryClient.invalidateQueries({ 
        queryKey: readingProgressKeys.all 
      });
    },
  });
}
