'use client';

import { memo } from 'react';
import { ReaderPageImage } from './ReaderPageImage';
import { ChapterEndNavigation } from '../layout/ChapterEndNavigation';
import type { ReaderChapterProps } from '../../types';

/**
 * ReaderChapter - Single chapter container
 * 
 * Responsibilities:
 * - Render all pages of a chapter
 * - Pass correct page numbers (absolute)
 * - Show chapter divider if not last (infinite scroll mode)
 * - Show chapter end navigation if last (non-infinite scroll mode)
 */
export const ReaderChapter = memo(function ReaderChapter({
  chapter,
  pageOffset,
  registerPage,
  isLast,
  nextChapterNumber,
  infiniteScroll,
  manhwaId,
  prevChapterId,
  nextChapterId,
  hasNext,
  hasPrev,
  onLoadPrev,
  onLoadNext,
  nextChapterIsVip,
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

      {/* Show divider between chapters in infinite scroll mode */}
      {infiniteScroll && !isLast && nextChapterNumber && (
        <div className="w-full bg-black flex items-center justify-center">
          {/* 20px gap with responsive content */}
          <div className="w-full py-5">{/* py-5 ≈ 20px */}
            {/* Desktop: centered end-of-chapter label */}
            <div className="hidden md:flex w-full justify-center">
              <span className="text-gray-400 text-sm">
                Кінець розділу {chapter.chapterNumber}
              </span>
            </div>

            {/* Mobile: two compact buttons like the screenshot */}
            <div className="flex md:hidden w-full items-center justify-between px-4">
              <button
                onClick={() => {
                  if (prevChapterId) {
                    window.location.href = `/reader/${manhwaId}/${prevChapterId}`;
                  } else {
                    window.location.href = `/manhwa/${manhwaId}`;
                  }
                }}
                className="text-sm flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-pink-300">До тайтлу</span>
              </button>

              <button
                onClick={() => {
                  if (nextChapterId) {
                    window.location.href = `/reader/${manhwaId}/${nextChapterId}`;
                  }
                }}
                className="text-sm flex items-center gap-2 bg-gradient-to-r from-pink-500 via-pink-400 to-pink-300 px-3 py-2 rounded text-white"
              >
                <span>Наступна</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show navigation at end of chapter in non-infinite scroll mode */}
      {!infiniteScroll && isLast && manhwaId && (
        <ChapterEndNavigation
          manhwaId={manhwaId}
          currentChapterNumber={chapter.chapterNumber}
          prevChapterId={prevChapterId}
          nextChapterId={nextChapterId}
          hasNext={hasNext ?? false}
          hasPrev={hasPrev ?? false}
          onLoadPrev={onLoadPrev}
          onLoadNext={onLoadNext}
          nextChapterIsVip={nextChapterIsVip}
        />
      )}
    </div>
  );
});

ReaderChapter.displayName = 'ReaderChapter';
