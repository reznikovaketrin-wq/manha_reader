import { useState, useRef, useCallback, useEffect } from 'react';
import type { UseReaderScrollReturn } from '../types';

interface UseReaderScrollConfig {
  totalPages: number;
  preloadThreshold?: number; // 0-1, default 0.7
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
  preloadThreshold = 0.7,
}: UseReaderScrollConfig): UseReaderScrollReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [shouldPreload, setShouldPreload] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageRefs = useRef<Map<number, HTMLElement>>(new Map());

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

        // Check preload threshold
        if (maxVisiblePage >= preloadPageNumber && !shouldPreload) {
          setShouldPreload(true);
        }
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
          el.setAttribute('data-page', pageNumber.toString());
          pageRefs.current.set(pageNumber, el);
          observerRef.current?.observe(el);
        } else {
          const existing = pageRefs.current.get(pageNumber);
          if (existing) {
            observerRef.current?.unobserve(existing);
            pageRefs.current.delete(pageNumber);
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

  // Reset preload flag when totalPages changes (new chapter loaded)
  useEffect(() => {
    setShouldPreload(false);
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    progress: Math.min(progress, 100),
    contentRef,
    registerPage,
    scrollNext,
    scrollPrev,
    scrollToTop,
    shouldPreload,
  };
}

export type { UseReaderScrollConfig };
