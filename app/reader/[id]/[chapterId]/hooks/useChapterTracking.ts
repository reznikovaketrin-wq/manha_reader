import { useMemo, useRef, useEffect } from 'react';
import type { ChapterData } from '../types';

interface UseChapterTrackingConfig {
  chapters: ChapterData[];
  currentPage: number;
  infiniteScroll: boolean;
  onShouldPreloadNext: () => void;
}

interface ChapterInfo {
  chapter: ChapterData;
  startPage: number;
  endPage: number;
  progressInChapter: number; // 0-100
}

/**
 * useChapterTracking - Track which chapter user is currently viewing
 * and trigger preload only for the immediate next chapter
 */
export function useChapterTracking({
  chapters,
  currentPage,
  infiniteScroll,
  onShouldPreloadNext,
}: UseChapterTrackingConfig): ChapterInfo | null {
  const lastPreloadedChapterIdRef = useRef<string | null>(null);

  // Calculate chapter boundaries and find current chapter
  const currentChapterInfo = useMemo<ChapterInfo | null>(() => {
    if (chapters.length === 0 || currentPage === 0) return null;

    let pageOffset = 0;
    
    for (const chapter of chapters) {
      const startPage = pageOffset + 1;
      const endPage = pageOffset + chapter.pages.length;
      
      // Check if current page is in this chapter
      if (currentPage >= startPage && currentPage <= endPage) {
        const pagesInChapter = chapter.pages.length;
        const pageInChapter = currentPage - startPage + 1;
        const progressInChapter = (pageInChapter / pagesInChapter) * 100;
        
        return {
          chapter,
          startPage,
          endPage,
          progressInChapter,
        };
      }
      
      pageOffset += chapter.pages.length;
    }
    
    return null;
  }, [chapters, currentPage]);

  // Check if we should preload next chapter
  useEffect(() => {
    if (!infiniteScroll || !currentChapterInfo) return;

    const { chapter, progressInChapter } = currentChapterInfo;
    
    // Only preload when we reach 90% of CURRENT chapter
    // and we haven't already preloaded for this chapter
    if (
      progressInChapter >= 90 &&
      lastPreloadedChapterIdRef.current !== chapter.id
    ) {
      // Find if there's a next chapter in loaded chapters
      const currentIndex = chapters.findIndex(ch => ch.id === chapter.id);
      const nextChapterInList = chapters[currentIndex + 1];
      
      // Only trigger if next chapter doesn't exist yet in our loaded list
      if (!nextChapterInList) {
        lastPreloadedChapterIdRef.current = chapter.id;
        onShouldPreloadNext();
      }
    }
  }, [currentChapterInfo, infiniteScroll, chapters, onShouldPreloadNext]);

  return currentChapterInfo;
}

export type { UseChapterTrackingConfig, ChapterInfo };
