import { useState, useRef, useCallback, useEffect } from 'react';
import type { UseReaderScrollReturn, ScrollResult } from '../types';

// Debug flag - set to false in production
const DEBUG_SCROLL = true;

interface UseReaderScrollConfig {
  totalPages: number;
  preloadThreshold?: number; // 0-1, default 0.9
}

/**
 * useReaderScroll - Scroll & visibility tracking
 * 
 * Responsibilities:
 * - Track visible page index
 * - Calculate scroll progress
 * - Expose navigation helpers
 * - Emit preload signal
 * 
 * Key design:
 * - Page visibility tracked via React refs
 * - Single IntersectionObserver
 * - No querySelectorAll
 * - No runtime DOM mutation
 */
export function useReaderScroll({
  totalPages,
  preloadThreshold = 0.9,
}: UseReaderScrollConfig): UseReaderScrollReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [shouldPreload, setShouldPreload] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageRefs = useRef<Map<number, HTMLElement>>(new Map());
  const pendingScrolls = useRef<Map<number, { resolve: (result: ScrollResult) => void; timer: number }>>(new Map());
  const loggedRegistrations = useRef<Set<number>>(new Set());

  // Calculate progress
  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  // Preload threshold page number
  const preloadPageNumber = Math.ceil(totalPages * preloadThreshold);

  // Setup observer
  useEffect(() => {
    if (!contentRef.current) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const handleIntersection: IntersectionObserverCallback = (entries) => {
      const visiblePages: number[] = [];

      entries.forEach((entry) => {
        const pageNumber = parseInt(
          entry.target.getAttribute('data-page') || '0',
          10
        );

        if (entry.isIntersecting && pageNumber > 0) {
          visiblePages.push(pageNumber);
        }
      });

      if (visiblePages.length > 0) {
        const maxVisiblePage = Math.max(...visiblePages);
        setCurrentPage(maxVisiblePage);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: contentRef.current,
      rootMargin: '0px',
      threshold: [0, 0.5, 1],
    });

    // Observe all registered pages
    pageRefs.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [totalPages, preloadPageNumber, shouldPreload]);

  // Register page ref (returns callback ref)
  const registerPage = useCallback(
    (pageNumber: number) => {
      return (el: HTMLElement | null) => {
        if (el) {
          // Avoid duplicate registration for the same page-element pair
          const existing = pageRefs.current.get(pageNumber);
          if (existing === el) {
            // already registered to the same element — skip
            return;
          }

          el.setAttribute('data-page', pageNumber.toString());
          pageRefs.current.set(pageNumber, el);

          // Only log the first time a page number is registered to reduce noise
          if (DEBUG_SCROLL && !loggedRegistrations.current.has(pageNumber)) {
            loggedRegistrations.current.add(pageNumber);
            console.log(`[ReaderScroll] Page registered: ${pageNumber}`);
          }

          try {
            observerRef.current?.observe(el);
          } catch (e) {
            // ignore observe errors in edge cases
          }

          // If there is a pending wait for this page, resolve and scroll
          const pending = pendingScrolls.current.get(pageNumber);
          if (pending) {
            // perform the scroll
            const elementTop = el.offsetTop;
            if (contentRef.current) {
              contentRef.current.scrollTo({ top: elementTop, behavior: 'smooth' });
              if (DEBUG_SCROLL) {
                console.log(`[ReaderScroll] ✓ Page ${pageNumber} registered and scrolled`);
              }
            }
            clearTimeout(pending.timer);
            pending.resolve({ success: true, reason: 'registered', pageNumber });
            pendingScrolls.current.delete(pageNumber);
          }
        } else {
          const existing = pageRefs.current.get(pageNumber);
          if (existing) {
            try {
              observerRef.current?.unobserve(existing);
            } catch (e) {
              // ignore
            }
            pageRefs.current.delete(pageNumber);
            loggedRegistrations.current.delete(pageNumber);
          }
        }
      };
    },
    []
  );

  // Navigation helpers
  const scrollNext = useCallback(() => {
    contentRef.current?.scrollBy({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  }, []);

  const scrollPrev = useCallback(() => {
    contentRef.current?.scrollBy({
      top: -window.innerHeight,
      behavior: 'smooth',
    });
  }, []);

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  // Scroll to specific page number
  const scrollToPage = useCallback((pageNumber: number) => {
    const pageElement = pageRefs.current.get(pageNumber);
    if (pageElement && contentRef.current) {
      const elementTop = pageElement.offsetTop;
      contentRef.current.scrollTo({
        top: elementTop,
        behavior: 'smooth',
      });
      return true;
    }
    return false;
  }, []);

  const waitForAndScroll = useCallback((pageNumber: number, timeoutMs = 3000) => {
    return new Promise<ScrollResult>((resolve) => {
      const startTime = Date.now();
      
      if (DEBUG_SCROLL) {
        console.log(`[ReaderScroll] waitForAndScroll: page=${pageNumber}, timeout=${timeoutMs}ms`);
      }

      if (!contentRef.current) {
        if (DEBUG_SCROLL) {
          console.warn(`[ReaderScroll] No content container`);
        }
        resolve({ success: false, reason: 'no-container', pageNumber });
        return;
      }

      // First: try direct DOM query (element might exist but not registered yet)
      const directElement = contentRef.current.querySelector(
        `[data-page="${pageNumber}"]`
      ) as HTMLElement | null;
      
      if (directElement) {
        const elementTop = directElement.offsetTop;
        contentRef.current.scrollTo({ top: elementTop, behavior: 'smooth' });
        const elapsed = Date.now() - startTime;
        if (DEBUG_SCROLL) {
          console.log(`[ReaderScroll] ✓ Scrolled to page ${pageNumber} directly (${elapsed}ms)`);
        }
        resolve({ success: true, reason: 'already-visible', pageNumber, elapsedMs: elapsed });
        return;
      }

      // Fallback: check in registered refs
      const pageElement = pageRefs.current.get(pageNumber);
      if (pageElement) {
        const elementTop = pageElement.offsetTop;
        contentRef.current.scrollTo({ top: elementTop, behavior: 'smooth' });
        const elapsed = Date.now() - startTime;
        if (DEBUG_SCROLL) {
          console.log(`[ReaderScroll] ✓ Scrolled to page ${pageNumber} from refs (${elapsed}ms)`);
        }
        resolve({ success: true, reason: 'already-visible', pageNumber, elapsedMs: elapsed });
        return;
      }

      const timer = window.setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (DEBUG_SCROLL) {
          console.warn(`[ReaderScroll] ✗ Timeout waiting for page ${pageNumber} (${elapsed}ms)`);
        }
        const pending = pendingScrolls.current.get(pageNumber);
        if (pending) {
          pending.resolve({ success: false, reason: 'timeout', pageNumber, elapsedMs: elapsed });
          pendingScrolls.current.delete(pageNumber);
        }
      }, timeoutMs);

      pendingScrolls.current.set(pageNumber, { 
        resolve: (result: ScrollResult) => resolve(result), 
        timer 
      });
    });
  }, []);

  // Reset on totalPages change
  useEffect(() => {
    // Reset handled in parent component
  }, [totalPages]);

  // Cleanup on unmount: disconnect observer and clear pending timers
  useEffect(() => {
    return () => {
      try {
        observerRef.current?.disconnect();
      } catch (e) {
        // ignore
      }
      pendingScrolls.current.forEach(({ timer, resolve }, pageNumber) => {
        clearTimeout(timer);
        // resolve as cancelled/timeout
        try {
          resolve({ success: false, reason: 'timeout', pageNumber });
        } catch (e) {
          // ignore
        }
      });
      pendingScrolls.current.clear();
      pageRefs.current.clear();
      loggedRegistrations.current.clear();
    };
  }, []);

  return {
    currentPage,
    totalPages,
    progress: Math.min(progress, 100),
    contentRef,
    registerPage,
    scrollNext,
    scrollPrev,
    scrollToTop,
    scrollToPage,
    waitForAndScroll,
    shouldPreload,
  };
}

export type { UseReaderScrollConfig };
