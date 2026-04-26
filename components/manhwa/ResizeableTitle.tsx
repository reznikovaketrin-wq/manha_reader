'use client';

import { useEffect, useRef, useState } from 'react';

interface ResizeableTitleProps {
  children: string;
  maxLines?: number;
  minFontSize?: number;
  maxFontSize?: number;
  onlyIfLong?: boolean;
  maxHeight?: number;  // ← НОВЫЙ ПАРАМЕТР: максимальная высота контейнера
}

const fontSizeCache = new Map<string, number>();

export default function ResizeableTitle({
  children,
  maxLines = 3,
  minFontSize = 18,
  maxFontSize = 32,
  onlyIfLong = false,
  maxHeight,  // ← НОВЫЙ ПАРАМЕТР
}: ResizeableTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);
  const calculatingRef = useRef(false);

  // ✅ Флаг что мы на клиенте (не на сервере)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    setIsMobile(mobile);
  }, []);

  const cacheKey = isMobile !== null 
    ? `title-${isMobile ? 'mobile' : 'desktop'}-${children.substring(0, 30)}`
    : null;

  useEffect(() => {
    // ОТЛАДКА: Логируем начало

    if (!cacheKey || isMobile === null || !isClient || calculatingRef.current) {
      return;
    }

    const element = titleRef.current;
    if (!element || element.offsetParent === null) {
      return;
    }

    // [1] Проверяем кеши
    if (fontSizeCache.has(cacheKey)) {
      const cached = fontSizeCache.get(cacheKey)!;
      setFontSize(cached);
      element.style.fontSize = `${cached}px`;
      return;
    }

    const cachedLS = localStorage.getItem(cacheKey);
    if (cachedLS) {
      const size = parseInt(cachedLS);
      if (!isNaN(size)) {
        fontSizeCache.set(cacheKey, size);
        setFontSize(size);
        element.style.fontSize = `${size}px`;
        return;
      }
    }

    calculatingRef.current = true;

    let bestSize = minFontSize;
    let bestMaxLines = 3;

    // НАЧАЛО РАСЧЕТА
    if (children.length > 30) {
    }

    const checkSize = (fontSize: number, targetLines: number): Promise<boolean> => {
      return new Promise((resolve) => {
        element.style.fontSize = `${fontSize}px`;
        
        setTimeout(() => {
          requestAnimationFrame(() => {
            if (!element) {
              resolve(false);
              return;
            }

            const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
            const height = element.offsetHeight;
            const width = element.offsetWidth;  // ✅ ДОБАВЛЯЕМ ШИРИНУ
            const lines = Math.ceil(height / lineHeight);

            // Логируем только для долгих названий
            if (children.length > 30) {
            }

            const fits = lines === targetLines;
            resolve(fits);
          });
        }, 5);
      });
    };

    const search = async () => {
      // Сохраняем исходную ширину и фиксируем её
      const originalWidth = element.offsetWidth;
      element.style.width = `${originalWidth}px`;
      

      // ОПРЕДЕЛЯЕМ ЦЕЛЕВЫЕ СТРОКИ: проверяем при максимальном размере
      element.style.fontSize = `${maxFontSize}px`;
      
      await new Promise(resolve => {
        setTimeout(() => {
          requestAnimationFrame(resolve);
        }, 10);
      });

      let lineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
      let height = element.offsetHeight;
      let initialLines = Math.round(height / lineHeight);

      if (children.length > 30) {
      }

      // Массив целевых значений строк: ищем на 1 строку меньше, чем minimum
      const targetLines = Math.max(1, initialLines - 1);
      
      if (children.length > 30) {
      }

      // Ищем размер для целевого количества строк
      
      for (let size = maxFontSize; size >= minFontSize; size -= 1) {
        element.style.fontSize = `${size}px`;
        
        await new Promise(resolve => {
          setTimeout(() => {
            requestAnimationFrame(resolve);
          }, 10);
        });

        lineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
        height = element.offsetHeight;
        const lines = Math.round(height / lineHeight);

        // Проверяем И строки, И высоту (если maxHeight задана)
        const fitsLines = lines <= targetLines;
        const fitsHeight = !maxHeight || height <= maxHeight;
        const fits = fitsLines && fitsHeight;

        if (children.length > 30 && size % 2 === 0) {
          const status = fits ? '✅' : '❌';
        }

        if (fits) {
          bestSize = size;
          bestMaxLines = targetLines;
          element.style.width = '';
          return;
        }
      }

      // Fallback: минимум
      bestSize = minFontSize;
      bestMaxLines = targetLines;
      
      // Восстанавливаем исходную ширину
      element.style.width = '';
    };

    // Запускаем поиск с использованием Promise.then()
    
    search().then(() => {
      // СОХРАНЕНИЕ (выполняется ПОСЛЕ того как search() полностью завершит работу)
      setTimeout(() => {
        if (!element) {
          console.error(`❌ Element не существует при сохранении!`);
          calculatingRef.current = false;
          return;
        }

        element.style.fontSize = `${bestSize}px`;
        fontSizeCache.set(cacheKey, bestSize);
        
        // Логируем сохранение
        if (children.length > 30) {
        }
        
        try {
          localStorage.setItem(cacheKey, bestSize.toString());
          const verify = localStorage.getItem(cacheKey);
          if (children.length > 30) {
          }
        } catch (err) {
          console.error(`❌ localStorage ошибка:`, err);
        }
        
        setFontSize(bestSize);
        calculatingRef.current = false;
      }, 50);
    });
  }, [cacheKey, maxFontSize, minFontSize, isMobile, isClient, children]);

  if (fontSize === null && (isMobile === null || !isClient)) {
    return <div style={{ height: '1em' }} />;
  }

  return (
    <h2
      ref={titleRef}
      className="
        mb-3
        font-extrabold uppercase
        tracking-tight-2 leading-[1]
        transition-all duration-300
      "
      style={{
        fontSize: fontSize !== null ? `${fontSize}px` : 'inherit',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
    >
      {children}
    </h2>
  );
}