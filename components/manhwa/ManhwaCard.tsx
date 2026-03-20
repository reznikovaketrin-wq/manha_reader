'use client';

import Link from 'next/link';
import { useRef, useEffect, useState, useCallback, memo } from 'react';
import AutoFitTitle from './AutoFitTitle';
import AutoFitStatusGroup from './AutoFitStatusGroup';

interface ManhwaCardProps {
  manhwa: {
    id: string;
    title: string;
    shortDescription: string;
    coverImage: string;
    status: 'ongoing' | 'completed' | 'hiatus' | 'paused' | 'ваншот';
    publicationType?: 'censored' | 'uncensored';
    type?: 'manhwa' | 'manga' | 'manhua';
  };
}

const ManhwaCard = memo(function ManhwaCard({ manhwa }: ManhwaCardProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [maxHeightForTitle, setMaxHeightForTitle] = useState<number>(50);

  const [titleHeight, setTitleHeight] = useState<number>(0);
  const [titleLineCount, setTitleLineCount] = useState<number>(1);

  const cacheRef = useRef({
    lastSectionHeight: 0,
    lastDescriptionHeight: 0,
    lastMaxHeight: 0,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    setIsMobile(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const statusMap: Record<string, string> = {
    'ongoing': 'ОНҐОЇНҐ',
    'completed': 'ЗАВЕРШЕНО',
    'hiatus': 'ПРИЗУПИНЕНО',
    'paused': 'НА ПАУЗІ',
    'ваншот': 'ВАНШОТ',
  };
  const statusText = statusMap[manhwa.status] || 'НЕВІДОМО';

  const typeLabels: Record<string, string> = {
    'manhwa': 'МАНХВА',
    'manga': 'МАНҐА',
    'manhua': 'МАНХУА',
  };

  const publicationLabels: Record<string, string> = {
    'uncensored': 'БЕЗ ЦЕНЗУРИ',
    'censored': 'ЦЕНЗУРОВАНО',
  };

  const lastSlashIndex = manhwa.coverImage.lastIndexOf('/');
  const baseImageUrl = lastSlashIndex !== -1
    ? manhwa.coverImage.slice(0, lastSlashIndex)
    : manhwa.coverImage;

  const backgroundImageUrl = `${baseImageUrl}/bg.png`;
  const characterImageUrl = `${baseImageUrl}/char.png`;

  const calculateImageSize = useCallback(() => {
    if (!sectionRef.current || !imgRef.current?.naturalWidth) return;

    const sectionHeight = sectionRef.current.offsetHeight;
    const sectionWidth = sectionRef.current.offsetWidth;
    const originalWidth = imgRef.current.naturalWidth;
    const originalHeight = imgRef.current.naturalHeight;
    const aspectRatio = originalWidth / originalHeight;

    const maxWidth = sectionWidth;
    const maxHeight = isMobile ? sectionHeight * 1.15 : sectionHeight * 1.15;

    let width: number;
    let height: number;

    if (maxWidth / aspectRatio < maxHeight) {
      width = maxWidth;
      height = maxWidth / aspectRatio;
    } else {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }

    setImgSize({ width, height });
  }, [isMobile]);

  const calculateContentHeight = useCallback(() => {
    if (!sectionRef.current) return;

    const sectionHeight = sectionRef.current.offsetHeight;

    if (cacheRef.current.lastSectionHeight === sectionHeight) {
      return;
    }

    const computedStyle = window.getComputedStyle(sectionRef.current);
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const paddingVertical = paddingTop + paddingBottom;

    const percentOfHeight = isMobile ? 0.55 : 0.50;
    const available = sectionHeight - paddingVertical;
    const newMaxHeight = Math.max(50, available * percentOfHeight);

    if (cacheRef.current.lastMaxHeight !== newMaxHeight) {
      cacheRef.current.lastSectionHeight = sectionHeight;
      cacheRef.current.lastMaxHeight = newMaxHeight;
      setMaxHeightForTitle(newMaxHeight);
    }
  }, [isMobile]);

  const recalculateAll = useCallback(() => {
    calculateImageSize();
    calculateContentHeight();
  }, [calculateImageSize, calculateContentHeight]);

  useEffect(() => {
    const img = imgRef.current;

    const rafId = requestAnimationFrame(() => {
      recalculateAll();
    });

    if (img) img.addEventListener('load', calculateImageSize);

    const observer = new ResizeObserver(() => {
      recalculateAll();
    });

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      if (img) img.removeEventListener('load', calculateImageSize);
    };
  }, [recalculateAll, calculateImageSize]);

  const handleTitleHeightChange = useCallback((data: { height: number; lineCount: number }) => {
    setTitleHeight(data.height);
    setTitleLineCount(data.lineCount);
  }, []);

  const getAdaptiveGap = (): string => {
    if (isMobile) {
      return titleLineCount === 1 ? 'gap-2' : 'gap-1';
    } else {
      return titleLineCount === 1 ? 'gap-4' : 'gap-2';
    }
  };

  const getAdaptiveTransform = (): string => {
    if (isMobile) return 'translateY(0)';
    
    if (titleLineCount === 1 && titleHeight < 60) {
      return 'translateY(8px)';
    }
    return 'translateY(0)';
  };

  return (
    <Link href={`/manhwa/${manhwa.id}`} className="block w-full">
      <section
        ref={sectionRef}
        className="
          relative w-full bg-[#111]
          hover:bg-[#141414]
          transition-all duration-150 ease-linear
          p-[var(--spacing-lg)]
          flex flex-col
          h-[clamp(100px,_40vw,_150px)]
          md:flex-row
          md:h-[clamp(320px,_60vw,_440px)]
          md:p-[var(--spacing-xl)]
        "
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        {/* 🏷️ ТЕГИ: publicationType и type с использованием AutoFitStatusGroup */}
        {(() => {
          const statusItems = [
            { id: 'status', label: statusText },
          ];
          
          if (manhwa.publicationType) {
            statusItems.push({
              id: 'publication',
              label: publicationLabels[manhwa.publicationType],
            });
          }
          
          if (manhwa.type) {
            statusItems.push({
              id: 'type',
              label: typeLabels[manhwa.type],
            });
          }

          return (
            <div className="-mt-[8px] md:absolute md:top-0 md:left-[var(--spacing-xl)] md:pt-[var(--spacing-xl)] z-[20] text-white uppercase">
              <AutoFitStatusGroup
                statuses={statusItems}
                isMobile={isMobile}
                mobileMaxHeight={16}
                mobileMaxWidth={280}
                mobileMinFontSize={7}
                mobileMaxFontSize={9}
                desktopMaxHeight={38}
                desktopMaxWidth={800}
                desktopMinFontSize={14}
                desktopMaxFontSize={30}
                gap={isMobile ? '20px' : '50px'}
              />
            </div>
          );
        })()}

        <img
          ref={imgRef}
          src={characterImageUrl}
          alt="character"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            zIndex: 10,
            pointerEvents: 'none',
            width: imgSize.width || 200,
            height: imgSize.height || 'auto',
            objectFit: 'cover',
          }}
        />

        <div
          ref={contentRef}
          className="
            relative z-20 flex flex-col
            mt-auto
            md:mt-0
            md:absolute md:left-[var(--spacing-xl)] md:bottom-[var(--spacing-xl)]
          "
          style={{
            gap: isMobile
              ? (titleLineCount === 1 ? '4px' : '4px')
              : (titleLineCount === 1 ? '14px' : '8px'),
            transform: getAdaptiveTransform(),
            transition: 'transform 150ms ease-linear, gap 150ms ease-linear',
          }}
        >
          {isMobile ? (
            <>
              <div className="max-w-[280px]">
                <AutoFitTitle
                  maxHeight={maxHeightForTitle ?? 50}
                  maxWidth={280}
                  minFontSize={14}
                  maxFontSize={32}
                  maxLines={3}
                  className="font-extrabold uppercase text-white tracking-tight [text-shadow:1px_1px_2px_rgba(0,0,0,0.9)]"
                  onHeightChange={handleTitleHeightChange}
                >
                  {manhwa.title}
                </AutoFitTitle>
              </div>

              {/* 📄 shortDescription */}
              <p className="text-white/80 [text-shadow:1px_1px_1px_rgba(0,0,0,0.9)] text-[7px] leading-tight line-clamp-3 max-w-[270px]">
                {manhwa.shortDescription}
              </p>
            </>
          ) : (
            <>
              <div className="max-w-[800px]">
                <AutoFitTitle
                  maxHeight={maxHeightForTitle ?? 120}
                  maxWidth={800}
                  minFontSize={32}
                  maxFontSize={90}
                  maxLines={2}
                  className="font-extrabold uppercase text-white tracking-tight [text-shadow:4px_3px_3px_rgba(0,0,0,0.9)]"
                  onHeightChange={handleTitleHeightChange}
                >
                  {manhwa.title}
                </AutoFitTitle>
              </div>

              {/* 📄 shortDescription */}
              <p className="text-white/85 [text-shadow:3px_2px_4px_rgba(0,0,0,0.9)] text-[clamp(12px,1.8vw,18px)] leading-tight max-w-[65%] pb-0">
                {manhwa.shortDescription}
              </p>
            </>
          )}
        </div>
      </section>
    </Link>
  );
});

export default ManhwaCard;