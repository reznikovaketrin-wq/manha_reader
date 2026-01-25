// ===== Domain Types =====

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  pagesCount: number;
  publishedAt: string;
  vipOnly?: boolean;
  vipEarlyDays?: number;
  publicAvailableAt?: string | null;
}

export interface Manhwa {
  id: string;
  title: string;
  chapters: Chapter[];
}

export interface ChapterData {
  id: string;
  chapterNumber: number;
  title: string;
  pages: string[];
}

// ===== Width Mode =====

export type WidthMode = 'fit' | 'fixed';

// ===== Scroll Result =====

export interface ScrollResult {
  success: boolean;
  reason?: 'already-visible' | 'registered' | 'timeout' | 'no-container';
  pageNumber?: number;
  elapsedMs?: number;
}

// ===== Hook Contracts =====

export interface UseReaderDataReturn {
  manhwa: Manhwa | null;
  chapters: ChapterData[];
  isLoading: boolean;
  error: Error | null;
  loadChapter: (id: string) => Promise<ChapterData | null>;
  
  preloadNext: () => void;
  getChapterIndex: (id: string) => number;
  hasNext: boolean;
  hasPrev: boolean;
  currentChapterMeta: Chapter | null;
  nextChapterMeta: Chapter | null;
  prevChapterMeta: Chapter | null;
}

export interface UseReaderScrollReturn {
  currentPage: number;
  totalPages: number;
  progress: number;
  contentRef: React.RefObject<HTMLDivElement>;
  registerPage: (pageNumber: number) => (el: HTMLElement | null) => void;
  scrollNext: () => void;
  scrollPrev: () => void;
  scrollToTop: () => void;
  scrollToPage: (pageNumber: number) => boolean;
  waitForAndScroll: (pageNumber: number, timeoutMs?: number) => Promise<ScrollResult>;
  shouldPreload: boolean;
}

export interface ReaderUIState {
  showUI: boolean;
  showSettings: boolean;
  showChapterList: boolean;
  brightness: number;
  autoScroll: boolean;
  autoScrollSpeed: number;
  widthMode: WidthMode;
  isFullscreen: boolean;
}

export interface UseReaderUIReturn extends ReaderUIState {
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
}

export interface UseReaderHotkeysConfig {
  onToggleUI: () => void;
  onScrollNext: () => void;
  onScrollPrev: () => void;
  onToggleFullscreen?: () => void;
  enabled?: boolean;
}

// ===== Component Props =====

export interface ReaderPageImageProps {
  src: string;
  alt: string;
  pageNumber: number;
  registerRef: (el: HTMLElement | null) => void;
  onLoad?: () => void;
  onError?: () => void;
}

export interface ReaderChapterProps {
  chapter: ChapterData;
  pageOffset: number;
  registerPage: (pageNumber: number) => (el: HTMLElement | null) => void;
  isLast: boolean;
  nextChapterNumber?: number;
  infiniteScroll: boolean;
  manhwaId?: string;
  prevChapterId?: string;
  nextChapterId?: string;
  hasNext?: boolean;
  hasPrev?: boolean;
  onLoadPrev?: () => void;
  onLoadNext?: () => void;
  nextChapterIsVip?: boolean;
}

export interface ReaderContentProps {
  chapters: ChapterData[];
  registerPage: (pageNumber: number) => (el: HTMLElement | null) => void;
  infiniteScroll: boolean;
  manhwaId: string;
  nextChapterId?: string;
  prevChapterId?: string;
  hasNext: boolean;
  hasPrev: boolean;
  onLoadPrev?: () => void;
  onLoadNext?: () => void;
  nextChapterIsVip?: boolean;
}

export interface ReaderHeaderProps {
  title: string;
  chapterNumber?: number;
  manhwaId: string;
  visible: boolean;
  onToggleSettings?: () => void;
}

export interface ReaderFooterProps {
  currentPage: number;
  totalPages: number;
  progress: number;
  visible: boolean;
  onToggleChapterList: () => void;
  onToggleComments?: () => void;
  onToggleAutoScroll: () => void;
  onScrollPrev: () => void;
  onScrollNext: () => void;
  autoScrollActive: boolean;
}

export interface ReaderSettingsPanelProps {
  visible: boolean;
  brightness: number;
  widthMode: WidthMode;
  isFullscreen: boolean;
  autoScrollSpeed: number;
  autoScrollActive: boolean;
  infiniteScroll: boolean;
  onBrightnessChange: (value: number) => void;
  onReset: () => void;
  onWidthModeChange: (mode: WidthMode) => void;
  onToggleFullscreen: () => void;
  onAutoScrollSpeedChange: (speed: number) => void;
  onToggleAutoScroll: () => void;
  onToggleInfiniteScroll: () => void;
}

export interface ReaderChapterListProps {
  visible: boolean;
  chapters: Chapter[];
  loadedChapterIds: Set<string>;
  manhwaId: string;
}

export interface ReaderLayoutProps {
  children: React.ReactNode;
  brightness: number;
  showUI: boolean;
  widthMode: WidthMode;
  contentRef: React.RefObject<HTMLDivElement>;
  onCenterClick: () => void;
  onLeftClick: () => void;
  onRightClick: () => void;
}