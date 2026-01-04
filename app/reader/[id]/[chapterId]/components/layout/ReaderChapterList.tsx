'use client';

import { memo } from 'react';
import Link from 'next/link';
import type { ReaderChapterListProps } from '../../types';

/**
 * ReaderChapterList - Chapter selection sidebar
 */
export const ReaderChapterList = memo(function ReaderChapterList({
  visible,
  chapters,
  loadedChapterIds,
  manhwaId,
}: ReaderChapterListProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed left-0 top-12 md:top-14 bottom-16 md:bottom-14 z-40 
                 bg-gray-900 border-r border-gray-800 overflow-y-auto 
                 w-64 md:w-80 max-w-[80vw]"
    >
      <div className="p-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Розділи ({chapters.length})
        </h3>

        <div className="space-y-2">
          {chapters.map((chapter) => {
            const isLoaded = loadedChapterIds.has(chapter.id);

            return (
              <Link
                key={chapter.id}
                href={`/reader/${manhwaId}/${chapter.id}`}
              >
                <div
                  className={`
                    p-3 rounded-lg transition-colors cursor-pointer
                    ${
                      isLoaded
                        ? 'bg-blue-600/20 border border-blue-500/50'
                        : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">
                      Розділ {chapter.chapterNumber}
                    </p>
                    {isLoaded && (
                      <span className="text-xs text-blue-400 flex-shrink-0 ml-2">
                        ●
                      </span>
                    )}
                  </div>

                  {chapter.title && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {chapter.title}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(chapter.publishedAt).toLocaleDateString('uk-UA')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ReaderChapterList.displayName = 'ReaderChapterList';
