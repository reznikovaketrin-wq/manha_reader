import { useEffect, useRef } from 'react';

interface UseAutoScrollConfig {
  enabled: boolean;
  speed?: number; // 1-100 scale
  containerRef: React.RefObject<HTMLElement>;
}

/**
 * useAutoScroll - Automatic scrolling with configurable speed
 * 
 * Speed scale: 1-100
 * - 1 = comfortable reading (~40 px/sec)
 * - 50 = medium (~150 px/sec)
 * - 100 = fast (~320 px/sec)
 * 
 * Minimum speed is already comfortable for reading.
 */
export function useAutoScroll({
  enabled,
  speed = 50,
  containerRef,
}: UseAutoScrollConfig): void {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Normalized speed 1-100
    const normalizedSpeed = Math.max(1, Math.min(100, speed));
    
    // Formula designed so that:
    // Speed 1 → 2px per 50ms = 40 px/sec (comfortable minimum)
    // Speed 50 → 4px per 25ms = 160 px/sec (medium)
    // Speed 100 → 8px per 25ms = 320 px/sec (fast)
    
    // Pixels per scroll: 2 to 8 (linear interpolation)
    const pixelsPerScroll = 5 + (normalizedSpeed / 100) * 6;
    
    // Interval: 50ms to 25ms (faster speed = smaller interval)
    const interval = 50 - (normalizedSpeed / 100) * 25;

    intervalRef.current = setInterval(() => {
      containerRef.current?.scrollBy({
        top: Math.round(pixelsPerScroll),
        behavior: 'auto',
      });
    }, Math.round(interval));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, speed, containerRef]);
}

export type { UseAutoScrollConfig };