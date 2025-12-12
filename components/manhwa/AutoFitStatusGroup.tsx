'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

interface StatusItem {
  id: string;
  label: string;
}

interface AutoFitStatusGroupProps {
  statuses: StatusItem[];
  isMobile: boolean;
  // Параметры для мобильной версии
  mobileMaxHeight?: number;
  mobileMaxWidth?: number;
  mobileMinFontSize?: number;
  mobileMaxFontSize?: number;
  // Параметры для десктопной версии
  desktopMaxHeight?: number;
  desktopMaxWidth?: number;
  desktopMinFontSize?: number;
  desktopMaxFontSize?: number;
  gap?: string;
  className?: string;
}

export default function AutoFitStatusGroup({
  statuses,
  isMobile,
  // Mobile defaults
  mobileMaxHeight = 16,
  mobileMaxWidth = 280,
  mobileMinFontSize = 7,
  mobileMaxFontSize = 11,
  // Desktop defaults
  desktopMaxHeight = 38,
  desktopMaxWidth = 800,
  desktopMinFontSize = 14,
  desktopMaxFontSize = 20,
  gap = isMobile ? '8px' : '24px',
  className = '',
}: AutoFitStatusGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(desktopMaxFontSize);
  const [isCalculated, setIsCalculated] = useState(false);
  const lastCalcRef = useRef<number>(0);

  // Выбираем параметры в зависимости от устройства
  const maxHeight = isMobile ? mobileMaxHeight : desktopMaxHeight;
  const maxWidth = isMobile ? mobileMaxWidth : desktopMaxWidth;
  const minFontSize = isMobile ? mobileMinFontSize : desktopMinFontSize;
  const maxFontSize = isMobile ? mobileMaxFontSize : desktopMaxFontSize;

  const isFitSize = useCallback((
    element: HTMLElement,
    size: number,
    containerMaxHeight: number,
    containerMaxWidth?: number
  ): boolean => {
    element.style.fontSize = `${size}px`;
    element.style.lineHeight = '1';

    const height = element.scrollHeight;
    if (height > containerMaxHeight) return false;

    if (containerMaxWidth) {
      const width = element.scrollWidth;
      if (width > containerMaxWidth) return false;
    }

    return true;
  }, []);

  const binarySearch = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;

    let left = minFontSize;
    let right = maxFontSize;
    let bestSize = minFontSize;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (isFitSize(content, mid, maxHeight, maxWidth)) {
        bestSize = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    content.style.fontSize = `${bestSize}px`;
    content.style.lineHeight = '1';

    setFontSize(bestSize);
    setIsCalculated(true);
  }, [maxHeight, maxWidth, minFontSize, maxFontSize, isFitSize]);

  const debouncedCalculate = useCallback(() => {
    const now = Date.now();
    
    if (now - lastCalcRef.current < 100) {
      return;
    }

    lastCalcRef.current = now;
    binarySearch();
  }, [binarySearch]);

  useEffect(() => {
    binarySearch();

    const ro = new ResizeObserver(() => {
      debouncedCalculate();
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => ro.disconnect();
  }, [isMobile, binarySearch, debouncedCalculate, statuses.length]);

  return (
    <div
      ref={containerRef}
      style={{
        maxHeight: maxHeight,
        maxWidth: maxWidth,
        overflow: 'hidden',
        display: 'inline-flex',
        height: 'auto',
        whiteSpace: 'nowrap',
        gap: gap,
      }}
    >
      <div
        ref={contentRef}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: '1',
          whiteSpace: 'nowrap',
          height: 'auto',
          display: 'inline-flex',
          gap: gap,
          opacity: isCalculated ? 1 : 0,
          transition: 'opacity 100ms',
        }}
      >
        {statuses.map((status) => (
          <span
            key={status.id}
            className={`font-medium tracking-tight drop-shadow-[3px_2px_6px_rgba(0,0,0,1)] ${className}`}
          >
            {status.label}
          </span>
        ))}
      </div>
    </div>
  );
}