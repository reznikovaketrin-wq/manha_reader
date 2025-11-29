'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import ResizeableTitle from './ResizeableTitle';

interface ManhwaCardProps {
  manhwa: {
    id: string;
    title: string;
    description: string;
    status: 'ongoing' | 'completed' | 'hiatus';
    coverImage: string;
    tags?: string[];
  };
}

export default function ManhwaCard({ manhwa }: ManhwaCardProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const bgImgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [bgSize, setBgSize] = useState({ width: 0, height: 0 });
  
  // 🆕 Определяем isMobile один раз в ManhwaCard!
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Определяем мобилку после загрузки компонента
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Первоначальная проверка
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  console.log(`🎴 ManhwaCard обновлён! isMobile=${isMobile} (${new Date().toLocaleTimeString()})`);

  const statusText =
    manhwa.status === 'ongoing'
      ? 'ОНГОЇНГ'
      : manhwa.status === 'completed'
      ? 'ЗАВЕРШЕНА'
      : 'HIATUS';

  const lastSlashIndex = manhwa.coverImage.lastIndexOf('/');
  const baseImageUrl =
    lastSlashIndex !== -1
      ? manhwa.coverImage.slice(0, lastSlashIndex)
      : manhwa.coverImage;

  const backgroundImageUrl = `${baseImageUrl}/bg.png`;
  const characterImageUrl = `${baseImageUrl}/char.png`;

  useEffect(() => {
    const calculateImageSize = () => {
      if (!sectionRef.current || !imgRef.current || !imgRef.current.naturalWidth) {
        return;
      }

      const sectionHeight = sectionRef.current.offsetHeight;
      const sectionWidth = sectionRef.current.offsetWidth;
      
      const originalWidth = imgRef.current.naturalWidth;
      const originalHeight = imgRef.current.naturalHeight;
      const aspectRatio = originalWidth / originalHeight;

      const maxWidth = sectionWidth;
      const maxHeight = isMobile ? sectionHeight * 1.15 : sectionHeight * 1.2;

      let calculatedWidth: number;
      let calculatedHeight: number;

      if (maxWidth / aspectRatio < maxHeight) {
        calculatedWidth = maxWidth;
        calculatedHeight = maxWidth / aspectRatio;
      } else {
        calculatedHeight = maxHeight;
        calculatedWidth = maxHeight * aspectRatio;
      }

      setImgSize({
        width: calculatedWidth,
        height: calculatedHeight,
      });
    };

    // Вычисляем размер фонового изображения
    const calculateBgSize = () => {
      if (!sectionRef.current || !bgImgRef.current || !bgImgRef.current.naturalWidth) {
        return;
      }

      const sectionHeight = sectionRef.current.offsetHeight;
      const sectionWidth = sectionRef.current.offsetWidth;

      // Коэффициент для подгонки высоты фона только на мобилке
      const bgHeightMultiplier = isMobile ? 1.05 : 1.0;

      // Фоновое изображение заполняет весь контейнер с коэффициентом
      const calculatedWidth = sectionWidth;
      const calculatedHeight = sectionHeight * bgHeightMultiplier;

      console.log(`📐 Background: width=${calculatedWidth.toFixed(0)}px, height=${calculatedHeight.toFixed(0)}px, multiplier=${bgHeightMultiplier}, isMobile=${isMobile}`);

      setBgSize({
        width: calculatedWidth,
        height: calculatedHeight,
      });
    };

    const img = imgRef.current;
    const bgImg = bgImgRef.current;
    
    if (img) {
      img.addEventListener('load', calculateImageSize);
    }
    if (bgImg) {
      bgImg.addEventListener('load', calculateBgSize);
    }

    const observer = new ResizeObserver(() => {
      calculateImageSize();
      calculateBgSize();
    });
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const timer = setTimeout(() => {
      calculateImageSize();
      calculateBgSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      if (img) {
        img.removeEventListener('load', calculateImageSize);
      }
      if (bgImg) {
        bgImg.removeEventListener('load', calculateBgSize);
      }
    };
  }, [isMobile, manhwa.title]);

  return (
    <Link href={`/manhwa/${manhwa.id}`} className="block w-full">
      <section
        ref={sectionRef}
        className="
          relative w-full
          bg-[#111111]
          transition-all duration-150 ease-linear
          hover:bg-[#141414]
          
          rounded-none
          overflow-visible
          p-[var(--spacing-lg)]
          
          flex flex-col
          h-[clamp(100px,_40vw,_150px)]
          
          md:rounded-[var(--radius-xl)]
          md:overflow-visible
          md:h-[clamp(320px,_60vw,_440px)]
          md:flex-row
          md:items-stretch
          md:p-[var(--spacing-xl)]
          md:gap-[var(--gap-lg)]
          md:hover:-translate-y-0.5 
          md:hover:shadow-[0_18px_40px_rgba(0,0,0,0.8)]
        "
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          // На мобилке и десктопе - используем вычисленный размер с коэффициентом
          backgroundSize: bgSize.width 
            ? `${bgSize.width}px ${bgSize.height}px` 
            : 'contain',
          gap: 'clamp(32px, 8vw, 48px)',
          // 🆕 На обеих платформах оставляем visible чтобы картинка выступала
          overflow: 'visible',
        } as React.CSSProperties}
      >
        {/* Скрытое изображение для вычисления размера фона */}
        <img
          ref={bgImgRef}
          src={backgroundImageUrl}
          alt="background"
          style={{ display: 'none' }}
          onError={() => console.log('Failed to load background image')}
        />

        {/* СТАТУСЫ */}
        <div
          className="
            flex flex-wrap gap-[clamp(12px,_5vw,_20px)]
            font-medium uppercase tracking-tight text-white
            w-full
            flex-shrink-0
            
            md:absolute 
            md:top-0
            md:left-[var(--spacing-xl)]
            md:z-40
            md:pt-[var(--spacing-xl)]
            md:w-auto
            md:flex-shrink-0
            md:gap-[clamp(40px,_10vw,_90px)]
          "
          style={{
            fontSize: 'clamp(10px, 2.5vw, 20px)',
            textShadow: `
              3px 2px 4px rgba(0, 0, 0, 0.45),
              3px 2px 8px rgba(0, 0, 0, 0.30),
              3px 2px 16px rgba(0, 0, 0, 0.15)
            `,
            zIndex: 40,
          }}
        >
          <span>{statusText}</span>
          {manhwa.tags && manhwa.tags.length > 0 && (
            <>
              {manhwa.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </>
          )}
        </div>

        {/* КАРТИНКА ПЕРСОНАЖА */}
        <img
          ref={imgRef}
          src={characterImageUrl}
          alt={`${manhwa.title} characters`}
          style={{
            position: 'absolute',
            right: '0',
            bottom: '0',
            zIndex: 10,
            pointerEvents: 'none',
            width: imgSize.width ? `${imgSize.width}px` : '200px',
            height: imgSize.height ? `${imgSize.height}px` : 'auto',
            objectFit: 'cover',
            objectPosition: 'right bottom',
            lineHeight: 0,
            display: 'block',
          }}
        />

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <div
          className="
            relative z-20
            flex flex-col gap-[clamp(12px, 3vw, 16px)]
            
            flex-1
            max-w-[80%]
            
            md:absolute md:left-[var(--spacing-xl)] md:bottom-[var(--spacing-xl)]
            md:max-w-[80%]
            md:flex-1
          "
        >
          {/* ЗАГОЛОВОК И ОПИСАНИЕ - МОБИЛКА */}
          {isMobile ? (
            <>
              <div className="max-w-[99%]" style={{ textShadow: `
                3px 2px 4px rgba(0, 0, 0, 0.45),
                3px 2px 8px rgba(0, 0, 0, 0.30),
                3px 2px 16px rgba(0, 0, 0, 0.15)
              ` }}>
                <ResizeableTitle 
                  maxLines={3} 
                  minFontSize={12} 
                  maxFontSize={28} 
                  onlyIfLong={true}
                  isMobile={isMobile}
                >
                  {manhwa.title}
                </ResizeableTitle>
              </div>

              <p
                className="
                  leading-[1.2] text-white/80
                  max-w-[99%]
                  line-clamp-2
                "
                style={{
                  fontSize: 'clamp(5px, 1vw, 7px)',
                  textShadow: `
                    3px 2px 4px rgba(0, 0, 0, 0.45),
                    3px 2px 8px rgba(0, 0, 0, 0.30),
                    3px 2px 16px rgba(0, 0, 0, 0.15)
                  `,
                }}
              >
                {manhwa.description}
              </p>
            </>
          ) : (
            <>
              {/* ЗАГОЛОВОК И ОПИСАНИЕ - ДЕСКТОП */}
              <div className="max-w-[99%]" style={{ textShadow: `
                3px 2px 5px rgba(0, 0, 0, 0.48),
                3px 2px 12px rgba(0, 0, 0, 0.32),
                3px 2px 20px rgba(0, 0, 0, 0.18)
              ` }}>
                <ResizeableTitle 
                  maxLines={2} 
                  minFontSize={42} 
                  maxFontSize={88} 
                  onlyIfLong={true}
                  isMobile={isMobile}
                >
                  {manhwa.title}
                </ResizeableTitle>
              </div>

              <p
                className="
                  leading-[1.3] text-white/80
                  max-w-[80%]
                  md:text-white/85
                  md:max-w-[70%]
                "
                style={{
                  fontSize: 'clamp(11px, 2vw, 17px)',
                  textShadow: `
                    3px 2px 5px rgba(0, 0, 0, 0.45),
                    3px 2px 12px rgba(0, 0, 0, 0.30),
                    3px 2px 20px rgba(0, 0, 0, 0.15)
                  `,
                }}
              >
                {manhwa.description}
              </p>
            </>
          )}
        </div>
      </section>
    </Link>
  );
}