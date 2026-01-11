'use client';

import { memo, useMemo } from 'react';
import { ReaderChapter } from './ReaderChapter';
import type { ReaderContentProps } from '../../types';

/**
 * ReaderContent - Chapter list container
 * 
 * Responsibilities:
 * - Calculate page offsets
 * - Render chapters in order
 * - Pass registration callbacks
 * - Pass navigation props to chapters
 */
export const ReaderContent = memo(function ReaderContent({
  chapters,
  registerPage,
  infiniteScroll,
  manhwaId,
  nextChapterId,
  prevChapterId,
  hasNext,
  hasPrev,
  onLoadPrev,
  onLoadNext,
}: ReaderContentProps) {
  // Calculate page offsets for each chapter
  const chapterOffsets = useMemo(() => {
    const offsets: number[] = [];
    let total = 0;

    chapters.forEach((chapter) => {
      offsets.push(total);
      total += chapter.pages.length;
    });

    return offsets;
  }, [chapters]);

  if (chapters.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-12 h-12 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p>Завантаження сторінок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {chapters.map((chapter, index) => (
        <ReaderChapter
          key={chapter.id}
          chapter={chapter}
          pageOffset={chapterOffsets[index]}
          registerPage={registerPage}
          isLast={index === chapters.length - 1}
          nextChapterNumber={chapters[index + 1]?.chapterNumber}
          // Pass chapter-specific neighbor ids for per-divider navigation,
          // but fall back to global neighbor ids (from props) when missing.
          prevChapterId={chapters[index - 1]?.id ?? prevChapterId}
          nextChapterId={chapters[index + 1]?.id ?? nextChapterId}
          infiniteScroll={infiniteScroll}
          manhwaId={manhwaId}
          // keep legacy props for global navigation (if used elsewhere)
          // these are optional and may be undefined
          hasNext={hasNext}
          hasPrev={hasPrev}
          onLoadPrev={onLoadPrev}
          onLoadNext={onLoadNext}
        />
      ))}
    </div>
  );
});

ReaderContent.displayName = 'ReaderContent';
