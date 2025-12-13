'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentHistory } from '@/lib/reading-history';
import { getManhwaById } from '@/data/manhwa';
import { ReadingHistory, Manhwa } from '@/types/manhwa';

export default function ContinueReading() {
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [manhwas, setManhwas] = useState<Record<string, Manhwa>>({});

  // Загрузка истории
  useEffect(() => {
    const loadHistory = () => {
      const recent = getRecentHistory(20);

      const uniqueHistory: Record<string, ReadingHistory> = {};

      recent.forEach((item) => {
        if (
          !uniqueHistory[item.manhwaId] ||
          new Date(item.timestamp) > new Date(uniqueHistory[item.manhwaId].timestamp)
        ) {
          uniqueHistory[item.manhwaId] = item;
        }
      });

      const deduped = Object.values(uniqueHistory)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        )
        .slice(0, 5);

      setHistory(deduped);
    };

    loadHistory();
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, []);

  // Загрузка манхв
  useEffect(() => {
    if (history.length === 0) return;

    const loadManhwas = async () => {
      const entries = await Promise.all(
        history.map(async (item) => {
          const manhwa = await getManhwaById(item.manhwaId);
          return manhwa ? [item.manhwaId, manhwa] : null;
        })
      );

      const map = Object.fromEntries(
        entries.filter(Boolean) as [string, Manhwa][]
      );

      setManhwas(map);
    };

    loadManhwas();
  }, [history]);

  if (history.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-extrabold uppercase mb-6">
        Продовжити читання
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {history.map((item) => {
          const manhwa = manhwas[item.manhwaId];
          if (!manhwa) return null;

          const chapter = manhwa.chapters.find(
            (ch) => ch.id === item.chapterId
          );
          if (!chapter) return null;

          return (
            <Link
              key={item.manhwaId}
              href={`/manhwa/${item.manhwaId}/${item.chapterId}`}
            >
              <div className="bg-card-bg rounded-lg overflow-hidden hover:border-text-muted/30 border border-transparent">
                <div
                  className="w-full aspect-[4/5] bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${manhwa.coverImage})`,
                    backgroundSize: 'contain',
                    backgroundColor: '#1a1a1a',
                  }}
                />

                <div className="p-2">
                  <h3 className="font-bold text-sm line-clamp-1">
                    {manhwa.title}
                  </h3>
                  <p className="text-xs text-text-muted">
                    Розділ {chapter.number}
                  </p>
                  <p className="text-xs text-text-muted">
                    Стор. {item.pageNumber}
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
