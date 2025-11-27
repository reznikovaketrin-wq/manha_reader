'use client';

import { useEffect, useRef, useState } from 'react';

interface ResizeableTitleProps {
  children: string;
  maxLines?: number;
  minFontSize?: number;
  maxFontSize?: number;
  onlyIfLong?: boolean;
}

export default function ResizeableTitle({
  children,
  maxLines = 3,
  minFontSize = 42,
  maxFontSize = 88,
  onlyIfLong = false,
}: ResizeableTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);

  // Генерируем уникальный ключ для этого заголовка
  const cacheKey = `title-${children.substring(0, 20)}`;

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;

    // Проверяем есть ли в localStorage кешированный размер
    if (typeof window !== 'undefined') {
      const cachedFontSize = localStorage.getItem(cacheKey);
      
      if (cachedFontSize) {
        // Используем кешированное значение
        setFontSize(parseInt(cachedFontSize));
        console.log(`✅ Используем кеш для "${children.substring(0, 20)}": ${cachedFontSize}px`);
        return;
      }

      // Если в кеше нет - вычисляем размер один раз
      console.log(`🔄 Вычисляем размер для "${children.substring(0, 20)}"`);
      
      let currentFontSize = maxFontSize;
      let iterations = 0;
      const maxIterations = 20;

      const calculateFontSize = () => {
        if (iterations >= maxIterations) {
          // Сохраняем в localStorage
          localStorage.setItem(cacheKey, currentFontSize.toString());
          setFontSize(currentFontSize);
          console.log(`💾 Сохранили в кеш: ${currentFontSize}px`);
          return;
        }

        element.style.fontSize = `${currentFontSize}px`;
        
        const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
        const height = element.offsetHeight;
        const lines = Math.ceil(height / lineHeight);

        // Если onlyIfLong включен и текст умещается в maxLines - не уменьшаем шрифт
        if (onlyIfLong && lines <= maxLines) {
          localStorage.setItem(cacheKey, maxFontSize.toString());
          setFontSize(maxFontSize);
          console.log(`✅ Текст умещается в ${maxLines} строк, используем maxFontSize: ${maxFontSize}px`);
          return;
        }

        if (lines > maxLines && currentFontSize > minFontSize) {
          currentFontSize = Math.max(currentFontSize - 2, minFontSize);
          iterations++;
          requestAnimationFrame(calculateFontSize);
        } else if (lines <= maxLines && currentFontSize < maxFontSize) {
          currentFontSize = Math.min(currentFontSize + 2, maxFontSize);
          iterations++;
          requestAnimationFrame(calculateFontSize);
        } else {
          // Нашли оптимальный размер
          localStorage.setItem(cacheKey, currentFontSize.toString());
          setFontSize(currentFontSize);
          console.log(`💾 Сохранили в кеш: ${currentFontSize}px`);
        }
      };

      calculateFontSize();
    }
  }, []);

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
        fontSize: fontSize ? `${fontSize}px` : `${maxFontSize}px`,
      }}
    >
      {children}
    </h2>
  );
}