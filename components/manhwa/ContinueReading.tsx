'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentHistory } from '@/lib/reading-history';
import { getManhwaById } from '@/data/manhwa';
import { ReadingHistory } from '@/types/manhwa';

export default function ContinueReading() {
  const [history, setHistory] = useState<ReadingHistory[]>([]);

  useEffect(() => {
    // Завантажити історію при монтуванні компонента
    const loadHistory = () => {
      const recent = getRecentHistory(5);
      setHistory(recent);
    };

    loadHistory();

    // Оновлювати при зміні localStorage
    window.addEventListener('storage', loadHistory);
    return () => window.removeEventListener('storage', loadHistory);
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-extrabold uppercase tracking-tight-2 mb-6">
        Продовжити читання
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => {
          const manhwa = getManhwaById(item.manhwaId);
          if (!manhwa) return null;

          const chapter = manhwa.chapters.find(ch => ch.id === item.chapterId);
          if (!chapter) return null;

          return (
            <Link
              key={item.manhwaId}
              href={`/manhwa/${item.manhwaId}/${item.chapterId}`}
              className="block"
            >
              <div className="bg-card-bg hover:bg-card-hover transition-colors rounded-lg overflow-hidden border border-transparent hover:border-text-muted/20">
                {/* Обкладинка */}
                <div 
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${manhwa.coverImage})` }}
                />

                {/* Інформація */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">
                    {manhwa.title}
                  </h3>
                  <p className="text-text-muted text-sm mb-2">
                    Розділ {chapter.number}: {chapter.title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Сторінка {item.pageNumber}</span>
                    <span>
                      {new Date(item.timestamp).toLocaleDateString('uk-UA', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
