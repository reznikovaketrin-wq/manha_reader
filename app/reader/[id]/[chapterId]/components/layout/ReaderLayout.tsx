'use client';

import { memo } from 'react';
import type { WidthMode } from '../../hooks';

interface ReaderLayoutProps {
  children: React.ReactNode;
  brightness: number;
  showUI: boolean;
  widthMode: WidthMode;
  contentRef: React.RefObject<HTMLDivElement>;
  onCenterClick: () => void;
  onLeftClick: () => void;
  onRightClick: () => void;
}

// Width constraints for different modes
const WIDTH_STYLES: Record<WidthMode, React.CSSProperties> = {
  fit: {
    maxWidth: '100%',
    width: '100%',
  },
  original: {
    maxWidth: 'none',
    width: 'auto',
  },
  fixed: {
    maxWidth: '720px',
    width: '100%',
  },
};

/**
 * ReaderLayout - Main content area with width modes
 * 
 * Width modes:
 * - fit: Full width (mobile default)
 * - original: Original image size
 * - fixed: 720px max (desktop comfort)
 */
export const ReaderLayout = memo(function ReaderLayout({
  children,
  brightness,
  showUI,
  widthMode,
  contentRef,
  onCenterClick,
  onLeftClick,
  onRightClick,
}: ReaderLayoutProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore clicks on interactive elements
    if ((e.target as HTMLElement).closest('button, a, input')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width * 0.25) {
      onLeftClick();
    } else if (clickX > width * 0.75) {
      onRightClick();
    } else {
      onCenterClick();
    }
  };

  return (
    <div
      ref={contentRef}
      className="flex-1 relative overflow-y-auto overflow-x-hidden w-full"
      style={{
        backgroundColor: '#000',
        marginTop: showUI ? '3rem' : '0',
        marginBottom: showUI ? '4rem' : '0',
        transition: 'margin 300ms ease-out',
        WebkitOverflowScrolling: 'touch',
      }}
      onClick={handleClick}
    >
      {/* Content wrapper with width constraint */}
      <div
        className="mx-auto"
        style={{
          ...WIDTH_STYLES[widthMode],
          filter: `brightness(${brightness}%)`,
        }}
      >
        {/* Image container with copy protection */}
        <div
          style={{
            // Prevent image selection/copying
            userSelect: 'none',
            WebkitUserSelect: 'none',
            // Prevent context menu on long press
            WebkitTouchCallout: 'none',
          }}
        >
          {children}
        </div>
      </div>

      {/* Click zone indicators (desktop only) */}
      {showUI && (
        <>
          <div
            className="fixed left-0 top-12 bottom-16 w-1/4 z-10 
                       opacity-0 hover:opacity-100 transition-opacity duration-200
                       hidden md:flex items-center justify-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onLeftClick();
            }}
          >
            <div className="bg-white/5 rounded-lg px-4 py-2">
              <span className="text-white/50 text-sm">← Вгору</span>
            </div>
          </div>

          <div
            className="fixed right-0 top-12 bottom-16 w-1/4 z-10 
                       opacity-0 hover:opacity-100 transition-opacity duration-200
                       hidden md:flex items-center justify-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onRightClick();
            }}
          >
            <div className="bg-white/5 rounded-lg px-4 py-2">
              <span className="text-white/50 text-sm">Вниз →</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

ReaderLayout.displayName = 'ReaderLayout';