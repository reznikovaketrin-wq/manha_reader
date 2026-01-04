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
  onToggleSettings,
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
        <div className="w-full h-0.5 bg-gray-800 rounded-full mb-1.5">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
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
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
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

            {/* Settings */}
            <button
              onClick={onToggleSettings}
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
              title="Налаштування"
              aria-label="Налаштування"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Comments */}
            {onToggleComments && (
              <button
                onClick={onToggleComments}
                className="p-1.5 hover:bg-gray-800 rounded transition-colors"
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
                autoScrollActive ? 'bg-blue-600' : 'hover:bg-gray-800'
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
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
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
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
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
