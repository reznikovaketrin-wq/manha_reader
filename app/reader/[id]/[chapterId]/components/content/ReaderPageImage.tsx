'use client';

import { memo, useState, useCallback } from 'react';

interface ReaderPageImageProps {
  src: string;
  alt: string;
  pageNumber: number;
  registerRef: (el: HTMLElement | null) => void;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * ReaderPageImage - Single page with copy protection
 * 
 * Features:
 * - Lazy loading
 * - Error fallback
 * - Copy protection (no drag, no select, no context menu)
 * - Loading skeleton
 */
export const ReaderPageImage = memo(function ReaderPageImage({
  src,
  alt,
  pageNumber,
  registerRef,
  onLoad,
  onError,
}: ReaderPageImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Prevent context menu (right click / long press)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  if (hasError) {
    return (
      <div
        ref={registerRef}
        className="w-full aspect-[2/3] bg-gray-900 flex items-center justify-center"
      >
        <div className="text-center text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">Сторінка {pageNumber}</p>
          <p className="text-xs mt-1">Помилка завантаження</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={registerRef} 
      className="relative w-full"
      onContextMenu={handleContextMenu}
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-2" />
            <span className="text-gray-500 text-xs">Стор. {pageNumber}</span>
          </div>
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className="w-full h-auto block"
        loading="lazy"
        decoding="async"
        // Copy protection
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={handleContextMenu}
        // Events
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease-in',
          // Additional copy protection
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />
    </div>
  );
});

ReaderPageImage.displayName = 'ReaderPageImage';