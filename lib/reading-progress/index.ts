/**
 * Reading Progress Module
 * 
 * Централизованный модуль для работы с прогрессом чтения
 * 
 * @example
 * // Queries
 * import { useReadingProgress, useContinueReading } from '@/lib/reading-progress';
 * 
 * // Mutations
 * import { useSaveProgress, useMarkChapterRead } from '@/lib/reading-progress';
 * 
 * // Types
 * import type { ReadingProgress } from '@/lib/reading-progress';
 */

// Types
export * from './types';

// Helper functions for reading progress data
export {
  cleanReadChapterIds,
  createReadChaptersSet,
} from './types';

// Queries
export {
  useReadingProgress,
  useContinueReading,
  useReadingHistory,
  useIsChapterRead,
  useReadChaptersSet,
} from './queries';

// Mutations
export {
  useSaveProgress,
  useMarkChapterRead,
  useSyncProgress,
} from './mutations';

// API (для прямого использования в server components или вне React)
export {
  fetchProgress,
  fetchRecentProgress,
  fetchAllProgress,
  saveProgress,
  markChapterAsRead,
  syncLocalToSupabase,
  getLocalProgress,
  getLocalRecentProgress,
  saveLocalProgress,
  clearLocalProgress,
} from './api';
