'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useContinueReading } from '@/lib/reading-progress';
import { getManhwaById } from '@/data/manhwa';
import type { Manhwa } from '@/types/manhwa';

export default function ContinueReading() {
  // React Query хук для отримання історії
  const { data: history = [], isLoading: loading } = useContinueReading({ limit: 8 });
  const [manhwas, setManhwas] = useState<Record<string, Manhwa>>({});
  const [loadingManhwas, setLoadingManhwas] = useState(false);

  // Мемоизируем ID манхв для сравнения
  const manhwaIds = useMemo(() => 
    history.map(item => item.manhwaId).sort().join(','),
    [history]
  );

  // Завантаження даних манхв с защитой от повторных вызовов
  const loadManhwas = useCallback(async (items: typeof history) => {
    if (items.length === 0 || loadingManhwas) return;
    
    setLoadingManhwas(true);
    try {
      const entries = await Promise.all(
        items.map(async (item) => {
          // Проверяем, нет ли уже этой манхвы в кеше
          if (manhwas[item.manhwaId]) {
            return [item.manhwaId, manhwas[item.manhwaId]];
          }
          
          try {
            const manhwa = await getManhwaById(item.manhwaId);
            return manhwa ? [item.manhwaId, manhwa] : null;
          } catch (error) {
            console.error(`[ContinueReading] Error loading manhwa ${item.manhwaId}:`, error);
            return null;
          }
        })
      );

      const map = Object.fromEntries(
        entries.filter(Boolean) as [string, Manhwa][]
      );

      setManhwas(prevManhwas => ({ ...prevManhwas, ...map }));
    } finally {
      setLoadingManhwas(false);
    }
  }, [loadingManhwas, manhwas]);

  useEffect(() => {
    loadManhwas(history);
  }, [manhwaIds]); // Используем manhwaIds вместо history

  // Skeleton під час завантаження
  if (loading || loadingManhwas) {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold uppercase mb-6">
          Продовжити читання
        </h2>
        <div className="flex md:grid md:grid-cols-6 lg:grid-cols-8 gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory pr-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card-bg rounded-lg overflow-hidden animate-pulse w-max flex-shrink-0 snap-start">
              <div className="w-36 aspect-[2/3] bg-gray-700" style={{ backgroundPosition: 'top center' }} />
              <div className="w-36 p-0">
                <div className="h-4 bg-gray-700 rounded mb-2" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Не показувати якщо історія порожня
  if (history.length === 0) return null;

  return (
    <div className="mb-2">
      <h2 className="text-2xl font-extrabold uppercase mb-6">
        Продовжити читання
      </h2>

      <div className="flex md:grid md:grid-cols-6 lg:grid-cols-8 gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory pr-3">
        {history.map((item) => {
          const manhwa = manhwas[item.manhwaId];
          if (!manhwa) return null;

          let chapter = manhwa.chapters.find(
            (ch) => String(ch.id) === String(item.currentChapterId)
          );

          if (!chapter) {
            // Попробовать подобрать по номеру главы, если в базе сохранён номер, а не внутренний id
            const fallbackByNumber = manhwa.chapters.find(
              (ch) => String(ch.number) === String(item.currentChapterId) || Number(ch.number) === Number(item.currentChapterId)
            );

            if (fallbackByNumber) {
              console.warn('[ContinueReading] Chapter id mismatch — using fallback by number', {
                originalChapterId: item.currentChapterId,
                matchedChapterId: fallbackByNumber.id,
              });
              chapter = fallbackByNumber;
            } else {
              console.warn('[ContinueReading] Chapter not found:', {
                chapterId: item.currentChapterId,
                availableIds: manhwa.chapters.map(c => c.id),
                availableNumbers: manhwa.chapters.map(c => c.number),
              });
              return null;
            }
          }

          return (
            <Link
              key={item.manhwaId}
              href={`/reader/${item.manhwaId}/${chapter.id}?page=${item.currentPage}`}
            >
              <div className="bg-card-bg rounded-lg overflow-hidden hover:border-text-muted/30 border border-transparent transition-colors w-max flex-shrink-0 snap-start">
                  <div
                    className="w-36 aspect-[2/3] bg-no-repeat"
                    style={{
                      backgroundImage: `url(${manhwa.coverImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'top center',
                      backgroundColor: '#1a1a1a',
                    }}
                />

                <div className="w-36 p-0">
                  <h3 className="font-bold text-xs line-clamp-1 mb-0">
                    {manhwa.title}
                  </h3>
                  <p className="text-[10px] text-text-muted m-0">
                    Розділ {chapter.number}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}