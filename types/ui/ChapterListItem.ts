'use client';

/**
 * UI Types - типы для UI компонентов
 * Берут данные из domain типов
 */

import type { Chapter } from '../domain/chapter';

/**
 * ChaptersListProps - пропсы для компонента ChaptersList
 */
export interface ChaptersListProps {
  chapters: Chapter[];
  manhwaId: string;
  readChapters: Set<string>;
  variant?: 'desktop' | 'mobile';
  onChapterClick?: (chapterId: string) => void;
}