'use client';

import { useEffect, useRef, useState } from 'react';

interface ResizeableTitleProps {
  children: string;
  maxLines?: number;
  minFontSize?: number;
  maxFontSize?: number;
}

export default function ResizeableTitle({
  children,
  maxLines = 3,
  minFontSize = 32,
  maxFontSize = 70,
}: ResizeableTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const element = titleRef.current;
    if (!element || !isChecking) return;

    // Даём время на рендер
    const timeout = setTimeout(() => {
      const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
      const height = element.scrollHeight;
      const lines = Math.ceil(height / lineHeight);

      console.log(`📏 Заголовок: ${lines} строк, шрифт: ${fontSize}px, высота: ${height}px`);

      // Если текст занимает БОЛЬШЕ чем maxLines
      if (lines > maxLines) {
        setFontSize((prev) => {
          const newSize = Math.max(prev - 2, minFontSize);
          console.log(`⬇️ Уменьшаем шрифт с ${prev}px на ${newSize}px`);
          return newSize;
        });
      } else if (lines <= maxLines && fontSize < maxFontSize) {
        // Если влезает в maxLines и есть место - пробуем увеличить
        setFontSize((prev) => {
          const newSize = Math.min(prev + 2, maxFontSize);
          console.log(`⬆️ Пытаемся увеличить шрифт с ${prev}px на ${newSize}px`);
          return newSize;
        });
      } else {
        // Если всё идеально - останавливаем
        setIsChecking(false);
        console.log(`✅ Текст идеально влезает в ${maxLines} строк`);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [fontSize, isChecking, maxLines, minFontSize, maxFontSize]);

  // Проверяем при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      setIsChecking(true);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <h2
      ref={titleRef}
      className="
        mb-3
        font-extrabold uppercase
        tracking-tight-2 leading-[1]
        transition-all duration-300
        max-[900px]:text-[44px]
        max-[640px]:text-[32px]
      "
      style={{
        fontSize: `${fontSize}px`,
      }}
    >
      {children}
    </h2>
  );
}