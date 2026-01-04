'use client';

import { useEffect, useState } from 'react';

interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * useScreen - определение размера экрана и типа устройства
 * 
 * Отвечает за:
 * - Размер окна браузера (width, height)
 * - Определение типа устройства (mobile/tablet/desktop)
 * - Реактивное обновление при resize
 * 
 * НЕ отвечает за:
 * - Логику приложения
 * - Управление состояниями
 */
export function useScreen(): ScreenSize {
  // Определения breakpoints
  const MOBILE_BREAKPOINT = 768;   // ≤ 768px
  const TABLET_BREAKPOINT = 1024;  // ≤ 1024px

  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    // SSR safe - начальное значение
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      };
    }

    return getScreenSize();
  });

  useEffect(() => {
    // Функция для обновления размера экрана
    const handleResize = () => {
      setScreenSize(getScreenSize());
    };

    // Добавляем слушатель с throttling для оптимизации
    let resizeTimer: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', throttledResize);
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return screenSize;

  // Вспомогательная функция
  function getScreenSize(): ScreenSize {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= MOBILE_BREAKPOINT;
    const isTablet = width > MOBILE_BREAKPOINT && width <= TABLET_BREAKPOINT;
    const isDesktop = width > TABLET_BREAKPOINT;

    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
    };
  }
}