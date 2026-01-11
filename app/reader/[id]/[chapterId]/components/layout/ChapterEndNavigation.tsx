'use client';

import { memo } from 'react';
import buttonStyles from '../../../../../../components/ManhwaPage/ReadButton.module.css';
import { useRouter } from 'next/navigation';

interface ChapterEndNavigationProps {
  manhwaId: string;
  currentChapterNumber: number;
  prevChapterId?: string;
  nextChapterId?: string;
  hasNext: boolean;
  hasPrev: boolean;
  onLoadPrev?: () => void;
  onLoadNext?: () => void;
}

/**
 * ChapterEndNavigation - Shows navigation buttons at the end of a chapter
 * Used when infinite scroll is disabled
 */
export const ChapterEndNavigation = memo(function ChapterEndNavigation({
  manhwaId,
  currentChapterNumber,
  prevChapterId,
  nextChapterId,
  hasNext,
  hasPrev,
  onLoadPrev,
  onLoadNext,
}: ChapterEndNavigationProps) {
  const router = useRouter();

  const handlePrev = () => {
    if (prevChapterId && onLoadPrev) {
      onLoadPrev();
    } else if (prevChapterId) {
      router.push(`/reader/${manhwaId}/${prevChapterId}`);
    }
  };

  const handleNext = () => {
    if (nextChapterId && onLoadNext) {
      onLoadNext();
    } else if (nextChapterId) {
      router.push(`/reader/${manhwaId}/${nextChapterId}`);
    }
  };

  const handleBackToManhwa = () => {
    router.push(`/manhwa/${manhwaId}`);
  };

  return (
    <div className="w-full bg-black py-12 px-4">
      <div className="max-w-md mx-auto text-center space-y-6">
        {/* Chapter complete message */}
        <div className="space-y-2">
          <div className="text-2xl">✓</div>
          <h3 className="text-xl font-semibold text-white">
            Розділ {currentChapterNumber} завершено
          </h3>
          <p className="text-sm text-gray-400">
            Оберіть наступну дію
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="space-y-3">
            {/* Next chapter */}
          {nextChapterId && (
            <button
              onClick={handleNext}
              className={`${buttonStyles.readButtonGradient} w-full relative z-50 mb-2 flex items-center justify-center gap-2`}
              aria-label="Перейти до наступного розділу"
            >
              <span>Наступний розділ</span>
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Previous chapter */}
          {prevChapterId && (
            <button
              onClick={handlePrev}
              className="w-full py-3 px-6 bg-[rgba(255,255,255,0.02)] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              style={{ border: '2px solid rgba(255,255,255,0.12)' }}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M15 19l-7-7 7-7" />
              </svg>
              <span>Попередній розділ</span>
            </button>
          )}

          {/* Back to manhwa page */}
          <button
            onClick={handleBackToManhwa}
            className="w-full py-3 px-6 bg-[rgba(255,255,255,0.02)] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            style={{ border: '2px solid rgba(255,255,255,0.12)' }}
          >
            <span>На сторінку манхви</span>
          </button>

          {/* End message */}
          {!hasNext && (
            <p className="text-sm text-gray-500 pt-4">
              Це останній доступний розділ
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

ChapterEndNavigation.displayName = 'ChapterEndNavigation';
