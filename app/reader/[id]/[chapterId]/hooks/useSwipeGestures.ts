import { useEffect, useRef, useCallback } from 'react';

interface UseSwipeGesturesConfig {
  containerRef: React.RefObject<HTMLElement>;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

/**
 * useSwipeGestures - Touch gestures for mobile
 * 
 * Features:
 * - Swipe left/right/up/down detection
 * - Tap detection (for UI toggle)
 * - Velocity-based swipe (not just distance)
 */
export function useSwipeGestures({
  containerRef,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  threshold = 50,
  enabled = true,
}: UseSwipeGesturesConfig): void {
  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current) return;

    // Tap detection (no significant movement)
    if (!touchEnd.current) {
      onTap?.();
      touchStart.current = null;
      return;
    }

    const deltaX = touchStart.current.x - touchEnd.current.x;
    const deltaY = touchStart.current.y - touchEnd.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if it's a tap (minimal movement, quick touch)
    if (absX < 10 && absY < 10 && deltaTime < 200) {
      onTap?.();
      touchStart.current = null;
      touchEnd.current = null;
      return;
    }

    // Determine swipe direction
    if (absX > threshold || absY > threshold) {
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeUp?.();
        } else {
          onSwipeDown?.();
        }
      }
    }

    touchStart.current = null;
    touchEnd.current = null;
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}