'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/app/providers/UserProvider';
import { useReadingHistory, ReadingProgress } from '@/lib/reading-progress';
import { getManhwaById } from '@/data/manhwa';
import type { Manhwa } from '@/types/manhwa';

interface ManhwaWithProgress {
  id: string;
  title: string;
  imageUrl: string;
  currentChapter: string;
  currentPage: number;
  totalPages: number;
}

export default function ReadingHistoryPage() {
  const { user, loading: userLoading } = useUser();
  
  // React Query хук для історії читання
  const { data: rawHistory = [], isLoading: historyLoading } = useReadingHistory();
  
  const [manhwas, setManhwas] = useState<Record<string, Manhwa>>({});
  const [manhwasLoading, setManhwasLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Завантажуємо дані манхв
  useEffect(() => {
    if (rawHistory.length === 0) return;

    const loadManhwas = async () => {
      setManhwasLoading(true);
      const entries = await Promise.all(
        rawHistory.map(async (item) => {
          try {
            const manhwa = await getManhwaById(item.manhwaId);
            return manhwa ? [item.manhwaId, manhwa] : null;
          } catch (error) {
            console.error(`Error loading manhwa ${item.manhwaId}:`, error);
            return null;
          }
        })
      );

      const map = Object.fromEntries(
        entries.filter(Boolean) as [string, Manhwa][]
      );

      setManhwas(map);
      setManhwasLoading(false);
    };

    loadManhwas();
  }, [rawHistory]);

  // ✅ Трансформуємо історію в формат для відображення
  const history = useMemo(() => {
    return rawHistory.map((item): ManhwaWithProgress | null => {
      const manhwa = manhwas[item.manhwaId];
      if (!manhwa) return null;

      const chapter = manhwa.chapters.find(
        (ch) => String(ch.id) === String(item.currentChapterId)
      );

      const totalPages = chapter?.pages?.length || 0;

      return {
        id: item.manhwaId,
        title: manhwa.title,
        imageUrl: manhwa.coverImage || '/placeholder.png',
        currentChapter: chapter?.number.toString() || '—',
        currentPage: item.currentPage,
        totalPages,
      };
    }).filter(Boolean) as ManhwaWithProgress[];
  }, [rawHistory, manhwas]);

  // ✅ Фільтрація та сортування
  const filteredHistory = useMemo(() => {
    let data = [...history];

    if (searchQuery) {
      data = data.filter((i) =>
        i.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === 'alphabetical') {
      data.sort((a, b) => a.title.localeCompare(b.title, 'uk-UA'));
    }

    return data;
  }, [searchQuery, sortBy, history]);

  const isLoading = userLoading || historyLoading || manhwasLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-main flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Завантаження історії читання...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-main flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Потрібна авторизація</p>
          <Link href="/auth" className="text-blue-500 hover:text-blue-400">
            Перейти до логіну
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-main">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Назад
          </Link>
          <h1 className="text-3xl font-bold">Історія читання</h1>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук манхви..."
            className="flex-1 px-4 py-2 bg-card-bg border border-text-muted/20 rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-blue-500 transition-colors"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'alphabetical')}
            className="px-4 py-2 bg-card-bg border border-text-muted/20 rounded-lg text-text-main focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="recent">Найновіші</option>
            <option value="alphabetical">За алфавітом</option>
          </select>
        </div>

        {/* History Grid */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted mb-4">
              {history.length === 0 ? 'Історія читання порожня' : 'Манхви не знайдено'}
            </p>
            <Link href="/library" className="text-blue-500 hover:text-blue-400">
              Перейти до бібліотеки
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredHistory.map((item) => (
              <Link key={item.id} href={`/manhwa/${item.id}`}>
                <div className="bg-card-bg rounded-lg overflow-hidden border border-text-muted/20 hover:border-blue-500/50 transition-colors cursor-pointer h-full flex flex-col">
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-card-hover">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-text-main">
                      {item.title}
                    </h3>
                    <p className="text-xs text-text-muted mb-2">
                      Розділ {item.currentChapter}
                    </p>

                    {/* Removed progress percentage and last-read date as requested */}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}