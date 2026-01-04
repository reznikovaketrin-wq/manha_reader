'use client';

import { memo } from 'react';
import { ReaderPageImage } from './ReaderPageImage';
import type { ReaderChapterProps } from '../../types';

/**
 * ReaderChapter - Single chapter container
 * 
 * Responsibilities:
 * - Render all pages of a chapter
 * - Pass correct page numbers (absolute)
 * - Show chapter divider if not last
 */
export const ReaderChapter = memo(function ReaderChapter({
  chapter,
  pageOffset,
  registerPage,
  isLast,
  nextChapterNumber,
}: ReaderChapterProps) {
  return (
    <div className="w-full">
      {chapter.pages.map((pageUrl, index) => {
        const absolutePageNumber = pageOffset + index + 1;

        return (
          <ReaderPageImage
            key={`${chapter.id}-${index}`}
            src={pageUrl}
            alt={`Розділ ${chapter.chapterNumber} - Сторінка ${index + 1}`}
            pageNumber={absolutePageNumber}
            registerRef={registerPage(absolutePageNumber)}
          />
        );
      })}

      {/* Chapter divider */}
      {!isLast && nextChapterNumber && (
        <div className="w-full h-12 bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
          <span className="text-gray-500 text-sm font-medium">
            Розділ {nextChapterNumber}
          </span>
        </div>
      )}
    </div>
  );
});

ReaderChapter.displayName = 'ReaderChapter';
