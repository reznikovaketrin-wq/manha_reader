'use client';

import { useEffect, useRef, useState } from 'react';

interface ResizeableTitleProps {
  children: string;
  maxLines?: number;
  minFontSize?: number;
  maxFontSize?: number;
  onlyIfLong?: boolean;
  isMobile?: boolean;
}

export default function ResizeableTitle({
  children,
  maxLines = 3,
  minFontSize = 32,
  maxFontSize = 70,
  onlyIfLong = false,
  isMobile = false,
}: ResizeableTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);

  // Используем переданный параметр isMobile вместо собственного расчета!
  // 🆕 Добавили maxFontSize в ключ чтобы разные размеры имели разные кеши!
  const cacheKey = `title-${isMobile ? 'mobile' : 'desktop'}-${maxFontSize}-${children.substring(0, 20)}`;

  console.log(`🆕 ResizeableTitle инициализирован! isMobile=${isMobile}, cacheKey=${cacheKey}, maxFontSize=${maxFontSize}`);

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;

    // Проверяем есть ли в localStorage кешированный размер
    if (typeof window !== 'undefined') {
      const cachedFontSize = localStorage.getItem(cacheKey);
      
      if (cachedFontSize) {
        const parsedSize = parseInt(cachedFontSize);
        
        // 🆕 Защита: размер не может быть меньше minFontSize!
        if (parsedSize < minFontSize) {
          console.log(`⚠️ Кеш ${cacheKey} имеет ${parsedSize}px но minFontSize=${minFontSize}! Пересчитываем...`);
          localStorage.removeItem(cacheKey); // Удаляем неверный кеш
          // Продолжаем вычисление дальше
        } else {
          // Используем кешированное значение
          setFontSize(parsedSize);
          console.log(`✅ Используем кеш: ${cacheKey} = ${cachedFontSize}px (maxFontSize=${maxFontSize})`);
          return;
        }
      }

      // Если в кеше нет - вычисляем размер один раз
      console.log(`🔄 Вычисляем размер для "${children.substring(0, 20)}" (${cacheKey})`);
      
      let currentFontSize = maxFontSize;
      let iterations = 0;
      const maxIterations = 20;

      const calculateFontSize = () => {
        if (iterations >= maxIterations) {
          // Сохраняем в localStorage
          localStorage.setItem(cacheKey, currentFontSize.toString());
          setFontSize(currentFontSize);
          console.log(`💾 Сохранили в кеш ${cacheKey}: ${currentFontSize}px`);
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
          console.log(`✅ Текст умещается в ${maxLines} строк, используем maxFontSize: ${maxFontSize}px (${cacheKey})`);
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
          console.log(`💾 Сохранили в кеш ${cacheKey}: ${currentFontSize}px`);
        }
      };

      calculateFontSize();
    }
  }, [cacheKey, maxFontSize, minFontSize, maxLines, onlyIfLong]); // 🆕 Добавил cacheKey в зависимости!

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