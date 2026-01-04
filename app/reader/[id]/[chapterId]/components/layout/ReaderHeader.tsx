'use client';

import { memo } from 'react';
import Link from 'next/link';
import type { ReaderHeaderProps } from '../../types';

/**
 * ReaderHeader - Top navigation bar
 */
export const ReaderHeader = memo(function ReaderHeader({
  title,
  chapterNumber,
  manhwaId,
  visible,
}: ReaderHeaderProps) {
  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-30
        bg-black/90 backdrop-blur-sm border-b border-gray-800
        transition-all duration-300 overflow-hidden
        ${visible ? 'h-12 md:h-14' : 'h-0 -translate-y-full'}
      `}
    >
      <div className="flex items-center justify-between px-2 py-1 md:px-4 md:py-2 h-full w-full">
        {/* Back button */}
        <Link
          href={`/manhwa/${manhwaId}`}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          aria-label="Назад до манхви"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>

        {/* Title */}
        <div className="flex-1 text-center min-w-0 px-2">
          <h1 className="text-xs md:text-sm font-semibold truncate">
            {title}
          </h1>
          {chapterNumber !== undefined && (
            <p className="text-xs text-gray-400">
              Розділ {chapterNumber}
            </p>
          )}
        </div>

        {/* Info button (placeholder) */}
        <button
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          aria-label="Інформація"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
});

ReaderHeader.displayName = 'ReaderHeader';
