"use client";

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
  onToggleSettings,
}: ReaderHeaderProps) {
  return (
    <header
      className={
        `
        fixed top-0 left-0 right-0 z-30
        bg-black/90 backdrop-blur-sm border-b border-gray-800
        transition-all duration-300 overflow-hidden
        ${visible ? 'h-12 md:h-14' : 'h-0 -translate-y-full'}
      `
      }
    >
      <div className="flex items-center justify-between px-2 py-1 md:px-4 md:py-2 h-full w-full">
        {/* Back button */}
        <Link
          href={`/manhwa/${manhwaId}`}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0"
          aria-label="Назад до манхви"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="#D1D5DB"
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
          <h1 className="text-xs md:text-sm font-semibold truncate">{title}</h1>
          {chapterNumber !== undefined && (
            <p className="text-xs text-gray-400">Розділ {chapterNumber}</p>
          )}
        </div>

        {/* Settings button (matching Back appearance) */}
        <button
          onClick={onToggleSettings}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0 border border-transparent"
          title="Налаштування"
          aria-label="Налаштування"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="#D1D5DB"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
});

ReaderHeader.displayName = 'ReaderHeader';
