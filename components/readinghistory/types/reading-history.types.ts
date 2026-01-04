/**
 * Типи для модуля історії читання
 */

export interface ReadingProgress {
  manhwaId: string;
  chapterId: string;
  pageNumber: number;
  progressPercent: number;
  updatedAt: string; // ISO timestamp
}

export interface ReadingProgressInput {
  manhwaId: string;
  chapterId: string;
  pageNumber: number;
}

export interface HistoryOptions {
  search?: string;
  sort?: 'date' | 'progress' | 'title';
  filter?: 'all' | 'completed' | 'active';
  limit?: number;
}

export interface StorageAdapter {
  saveProgress(progress: ReadingProgress): Promise<void>;
  getProgress(manhwaId: string): Promise<ReadingProgress | null>;
  getRecentList(limit: number): Promise<ReadingProgress[]>;
  getAllProgress(): Promise<ReadingProgress[]>;
  clearProgress(manhwaId: string): Promise<void>;
  clearAll(): Promise<void>;
}

export interface MergeResult {
  merged: ReadingProgress[];
  localCleared: number;
}