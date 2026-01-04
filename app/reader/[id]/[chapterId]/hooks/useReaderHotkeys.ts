import { useEffect, useCallback } from 'react';

interface UseReaderHotkeysConfig {
  onToggleUI: () => void;
  onScrollNext: () => void;
  onScrollPrev: () => void;
  onToggleFullscreen?: () => void;
  enabled?: boolean;
}

/**
 * useReaderHotkeys - Keyboard navigation with fullscreen support
 */
export function useReaderHotkeys({
  onToggleUI,
  onScrollNext,
  onScrollPrev,
  onToggleFullscreen,
  enabled = true,
}: UseReaderHotkeysConfig): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'escape':
          onToggleUI();
          break;

        case 'f':
          event.preventDefault();
          onToggleFullscreen?.();
          break;

        case 'arrowright':
        case ' ': // Space
          event.preventDefault();
          onScrollNext();
          break;

        case 'arrowleft':
          event.preventDefault();
          onScrollPrev();
          break;

        case 'arrowdown':
        case 'pagedown':
          event.preventDefault();
          onScrollNext();
          break;

        case 'arrowup':
        case 'pageup':
          event.preventDefault();
          onScrollPrev();
          break;

        case 'home':
          event.preventDefault();
          // Could add scrollToTop
          break;

        case 'end':
          event.preventDefault();
          // Could add scrollToBottom
          break;

        default:
          break;
      }
    },
    [enabled, onToggleUI, onScrollNext, onScrollPrev, onToggleFullscreen]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}