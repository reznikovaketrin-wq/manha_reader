'use client';

import { memo } from 'react';
import type { ReaderFooterProps } from '../../types';

/**
 * ReaderFooter - Bottom navigation bar
 */
export const ReaderFooter = memo(function ReaderFooter({
  currentPage,
  totalPages,
  progress,
  visible,
  onToggleChapterList,
  onToggleComments,
  onToggleAutoScroll,
  onScrollPrev,
  onScrollNext,
  autoScrollActive,
}: ReaderFooterProps) {
  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-30
        bg-black/90 backdrop-blur-sm border-t border-gray-800
        transition-all duration-300 overflow-hidden
        ${visible ? 'h-16 md:h-14' : 'h-0 translate-y-full'}
      `}
    >
      <div className="px-2 py-1.5 md:px-4 md:py-2 h-full flex flex-col justify-center w-full">
        {/* Progress bar */}
        <div className="w-full h-0.5 bg-gray-700 rounded-full mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: 'linear-gradient(135deg, #FF1B6D, #A259FF)' }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-1 w-full">
          {/* Page counter */}
          <div className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap min-w-[3rem]">
            {currentPage}/{totalPages}
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
            {/* Chapter list */}
            <button
              onClick={onToggleChapterList}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
              title="Список розділів"
              aria-label="Список розділів"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Settings removed from footer - moved to header */}

            {/* Comments */}
            {onToggleComments && (
              <button
                onClick={onToggleComments}
                className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-gray-300"
                title="Коментарі розділу"
                aria-label="Коментарі розділу"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4-.84L3 20l1.16-3.45A7.955 7.955 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>
            )}

            {/* Auto scroll */}
            <button
              onClick={onToggleAutoScroll}
              className={`p-1.5 rounded transition-colors ${
                autoScrollActive ? 'bg-gradient-to-r from-pink-500 via-pink-400 to-pink-300 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title="Автопрокрутка"
              aria-label="Автопрокрутка"
              aria-pressed={autoScrollActive}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={onScrollPrev}
              className="p-1.5 hover:bg-gray-600 rounded transition-colors bg-transparent"
              title="Попередня сторінка"
              aria-label="Попередня сторінка"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={onScrollNext}
              className="p-1.5 hover:bg-gray-600 rounded transition-colors bg-transparent"
              title="Наступна сторінка"
              aria-label="Наступна сторінка"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ReaderFooter.displayName = 'ReaderFooter';
