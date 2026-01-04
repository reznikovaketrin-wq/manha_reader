'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoFitTitleProps {
  children: string;
  maxHeight: number;
  maxWidth?: number;
  minFontSize?: number;
  maxFontSize?: number;
  maxLines?: number;
  className?: string;
  onFontSizeChange?: (size: number) => void;
  onHeightChange?: (data: { height: number; lineCount: number }) => void;
}

export default function AutoFitTitle({
  children,
  maxHeight,
  maxWidth,
  minFontSize = 14,
  maxFontSize = 32,
  maxLines,
  className = '',
  onFontSizeChange,
  onHeightChange,
}: AutoFitTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isCalculated, setIsCalculated] = useState(false);
  const lastCalcRef = useRef<number>(0);

  const getAdaptiveLineHeight = (size: number): number => {
    if (size <= 16) return 1.1;
    if (size <= 32) return 1.0;
    if (size <= 100) return 1.0;
    return 1.2;
  };

  const countLines = (element: HTMLElement): number => {
    const height = element.scrollHeight;
    const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
    return Math.round(height / lineHeight);
  };

  const getActualDimensions = (element: HTMLElement): { height: number; lineCount: number } => {
    const height = element.scrollHeight;
    const lineCount = countLines(element);
    return { height, lineCount };
  };

  const isFitSize = useCallback((
    element: HTMLElement,
    size: number,
    containerMaxHeight: number,
    containerMaxWidth?: number,
    limit?: number
  ): boolean => {
    element.style.fontSize = `${size}px`;
    element.style.lineHeight = String(getAdaptiveLineHeight(size));

    const height = element.scrollHeight;
    if (height > containerMaxHeight) return false;

    if (containerMaxWidth) {
      const width = element.scrollWidth;
      if (width > containerMaxWidth) return false;
    }

    if (limit) {
      const lines = countLines(element);
      if (lines > limit) return false;
    }

    return true;
  }, []);

  const binarySearch = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;

    const containerMaxWidth = maxWidth || containerRef.current?.offsetWidth;
    let left = minFontSize;
    let right = maxFontSize;
    let bestSize = minFontSize;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (isFitSize(content, mid, maxHeight, containerMaxWidth, maxLines)) {
        bestSize = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    content.style.fontSize = `${bestSize}px`;
    content.style.lineHeight = String(getAdaptiveLineHeight(bestSize));

    const dimensions = getActualDimensions(content);
    onHeightChange?.(dimensions);

    setFontSize(bestSize);
    onFontSizeChange?.(bestSize);
    setIsCalculated(true);
  }, [maxHeight, maxWidth, minFontSize, maxFontSize, maxLines, isFitSize, onFontSizeChange, onHeightChange]);

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
  }, [children, maxHeight, maxWidth, minFontSize, maxFontSize, maxLines, binarySearch, debouncedCalculate]);

  return (
    <div
      ref={containerRef}
      style={{
            maxHeight: maxHeight,      // <-- ограничение
            width: maxWidth ? maxWidth : '100%',
            overflow: 'hidden',
            display: 'block',          // <-- важнейшее изменение
            height: 'auto',            // <-- контейнер подстраивается под текст
            }}
    >
      <div
        ref={contentRef}
        className={className}
        style={{
                fontSize: `${fontSize}px`,
                lineHeight: getAdaptiveLineHeight(fontSize),
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                height: 'auto',           // <-- важно!
                display: 'inline-block',  // <-- чтобы занимал реальную высоту текста
                paddingBottom: '6px',
                opacity: isCalculated ? 1 : 0,
                transition: 'opacity 100ms',
}}
      >
        {children}
      </div>
    </div>
  );
}