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
                 border-r border-gray-700 overflow-y-auto 
                 w-64 md:w-80 max-w-[80vw]"
      style={{ background: '#000000' }}
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
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${isLoaded ? 'text-white' : 'bg-transparent border text-white/80'}`}
                  style={isLoaded ? { background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box', border: '2px solid transparent' } : { border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate text-white">
                      {chapter.title ? chapter.title : 'Розділ'}
                    </p>
                    {isLoaded && (
                      <span
                        className="flex-shrink-0 ml-2"
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '9999px',
                          background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                          border: '2px solid transparent',
                          display: 'inline-block'
                        }}
                      />
                    )}
                  </div>
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
