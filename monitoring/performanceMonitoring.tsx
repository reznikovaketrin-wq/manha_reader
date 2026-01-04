'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

export function initSentry() {
  if (typeof window === 'undefined') return;
}

export function reportWebVitals(metric?: unknown) {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1] as any;
          const lcpValue = lastEntry.renderTime || lastEntry.loadTime || 0;
          console.log('LCP:', lcpValue);
        }
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        console.warn('LCP unsupported');
      }

      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          const le = entry as any;
          if (!le.hadRecentInput) {
            clsValue += le.value || 0;
          }
        }
        console.log('CLS:', clsValue);
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch {
        console.warn('CLS unsupported');
      }

      const inpObserver = new PerformanceObserver((list) => {
        let maxDuration = 0;
        for (const entry of list.getEntries()) {
          const duration = (entry as any).duration || 0;
          if (duration > maxDuration) {
            maxDuration = duration;
          }
        }
        console.log('INP:', maxDuration);
      });

      try {
        inpObserver.observe({ entryTypes: ['event'] });
      } catch {
        console.warn('INP unsupported');
      }
    } catch {
      console.warn('Web Vitals error');
    }
  }
}

export function usePerformanceMonitoring() {
  useEffect(() => {
    initSentry();
    reportWebVitals();
  }, []);
}

export function PerformanceMonitoringProvider({
  children,
}: {
  children: ReactNode;
}) {
  usePerformanceMonitoring();
  return <>{children}</>;
}