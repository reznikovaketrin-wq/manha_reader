import { useState, useCallback, useEffect } from 'react';

const BRIGHTNESS_KEY = 'manhwa-brightness';
const WIDTH_MODE_KEY = 'manhwa-width-mode';
const AUTO_SCROLL_SPEED_KEY = 'manhwa-auto-scroll-speed';
const INFINITE_SCROLL_KEY = 'manhwa-infinite-scroll';
const DEFAULT_BRIGHTNESS = 100;
const DEFAULT_AUTO_SCROLL_SPEED = 50; // 1-100 scale, 50 = medium

export type WidthMode = 'fit' | 'fixed';

export interface UseReaderUIReturn {
  // Visibility
  showUI: boolean;
  showSettings: boolean;
  showChapterList: boolean;
  
  // Settings
  brightness: number;
  autoScroll: boolean;
  autoScrollSpeed: number;
  widthMode: WidthMode;
  isFullscreen: boolean;
  infiniteScroll: boolean;
  
  // Actions
  toggleUI: () => void;
  toggleSettings: () => void;
  toggleChapterList: () => void;
  setBrightness: (value: number) => void;
  resetBrightness: () => void;
  toggleAutoScroll: () => void;
  setAutoScrollSpeed: (speed: number) => void;
  closeAllPanels: () => void;
  setWidthMode: (mode: WidthMode) => void;
  toggleFullscreen: () => void;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  toggleInfiniteScroll: () => void;
}

/**
 * useReaderUI - Centralized UI state with fullscreen support
 */
export function useReaderUI(): UseReaderUIReturn {
  // Initialize from localStorage
  const [brightness, setBrightnessState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_BRIGHTNESS;
    const saved = localStorage.getItem(BRIGHTNESS_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_BRIGHTNESS;
  });

  const [widthMode, setWidthModeState] = useState<WidthMode>(() => {
    if (typeof window === 'undefined') return 'fit';
    const saved = localStorage.getItem(WIDTH_MODE_KEY);
    // If user had the removed 'original' value saved, migrate it to 'fixed' (comfortable)
    if (saved === 'original') return 'fixed';
    return (saved as WidthMode) || 'fixed';
  });

  const [showUI, setShowUI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [autoScrollSpeed, setAutoScrollSpeedState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_AUTO_SCROLL_SPEED;
    const saved = localStorage.getItem(AUTO_SCROLL_SPEED_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_AUTO_SCROLL_SPEED;
  });

  const [infiniteScroll, setInfiniteScroll] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(INFINITE_SCROLL_KEY);
    return saved ? saved === 'true' : true;
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem(BRIGHTNESS_KEY, brightness.toString());
  }, [brightness]);

  useEffect(() => {
    localStorage.setItem(WIDTH_MODE_KEY, widthMode);
  }, [widthMode]);

  useEffect(() => {
    localStorage.setItem(AUTO_SCROLL_SPEED_KEY, autoScrollSpeed.toString());
  }, [autoScrollSpeed]);

  useEffect(() => {
    localStorage.setItem(INFINITE_SCROLL_KEY, infiniteScroll.toString());
  }, [infiniteScroll]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check both standard and webkit fullscreen APIs
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      // Clean up pseudo-fullscreen on unmount
      delete document.documentElement.dataset.pseudoFullscreen;
    };
  }, []);

  // === Fullscreen API ===

  // Activate pseudo-fullscreen for browsers that don't support the Fullscreen API (iOS Safari, Telegram iOS)
  const enterPseudoFullscreen = useCallback(() => {
    document.documentElement.dataset.pseudoFullscreen = 'true';
    setIsFullscreen(true);
    // Attempt to hide the iOS address bar by scrolling 1px
    try { window.scrollTo(0, 1); } catch (_) {}
  }, []);

  const exitPseudoFullscreen = useCallback(() => {
    delete document.documentElement.dataset.pseudoFullscreen;
    setIsFullscreen(false);
  }, []);

  const enterFullscreen = useCallback(async () => {
    const elem = document.documentElement;

    // Check if native Fullscreen API is actually allowed by the browser
    // iOS Safari and Telegram iOS always return false/undefined here
    const nativeEnabled = !!(document.fullscreenEnabled || (document as any).webkitFullscreenEnabled);

    if (nativeEnabled) {
      try {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          await (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }
        return; // Success — state will be updated by fullscreenchange event
      } catch (err) {
        // Native API exists but was blocked (e.g. Telegram Android) — fall through to pseudo-fullscreen
      }
    }

    // Pseudo-fullscreen fallback: iOS Safari, Telegram iOS, or blocked API
    enterPseudoFullscreen();
  }, [enterPseudoFullscreen]);

  const exitFullscreen = useCallback(async () => {
    // If we're in pseudo-fullscreen mode, just clear it
    if (document.documentElement.dataset.pseudoFullscreen) {
      exitPseudoFullscreen();
      return;
    }

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      // Already not in fullscreen
      setIsFullscreen(false);
    }
  }, [exitPseudoFullscreen]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // === UI Toggles ===
  const toggleUI = useCallback(() => {
    setShowUI((prev) => {
      const newValue = !prev;
      // On mobile, toggle fullscreen with UI
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        if (newValue) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      }
      return newValue;
    });
    setShowSettings(false);
    setShowChapterList(false);
  }, [enterFullscreen, exitFullscreen]);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
    setShowChapterList(false);
  }, []);

  const toggleChapterList = useCallback(() => {
    setShowChapterList((prev) => !prev);
    setShowSettings(false);
  }, []);

  const setBrightness = useCallback((value: number) => {
    const clamped = Math.max(10, Math.min(200, value));
    setBrightnessState(clamped);
  }, []);

  const resetBrightness = useCallback(() => {
    setBrightnessState(DEFAULT_BRIGHTNESS);
  }, []);

  const toggleAutoScroll = useCallback(() => {
    setAutoScroll((prev) => !prev);
  }, []);

  const setAutoScrollSpeed = useCallback((speed: number) => {
    const clamped = Math.max(1, Math.min(100, speed));
    setAutoScrollSpeedState(clamped);
  }, []);

  const closeAllPanels = useCallback(() => {
    setShowSettings(false);
    setShowChapterList(false);
  }, []);

  const setWidthMode = useCallback((mode: WidthMode) => {
    setWidthModeState(mode);
  }, []);

  const toggleInfiniteScroll = useCallback(() => {
    setInfiniteScroll((prev) => !prev);
  }, []);

  return {
    showUI,
    showSettings,
    showChapterList,
    brightness,
    autoScroll,
    autoScrollSpeed,
    widthMode,
    isFullscreen,
    infiniteScroll,
    
    toggleUI,
    toggleSettings,
    toggleChapterList,
    setBrightness,
    resetBrightness,
    toggleAutoScroll,
    setAutoScrollSpeed,
    closeAllPanels,
    setWidthMode,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleInfiniteScroll,
  };
}