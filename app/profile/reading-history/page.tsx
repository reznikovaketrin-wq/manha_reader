'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getManhwaById } from '@/data/manhwa';

interface ReadingHistory {
  id: string;
  manhwa_id: string;
  chapter_id: string;
  page_number: number;
  read_at: string;
}

interface ManhwaWithProgress {
  id: string;
  title: string;
  imageUrl: string;
  currentChapter: string;
  currentPage: number;
  totalPages: number;
  lastRead: string;
  progress: number; // в процентах
}

export default function ReadingHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ManhwaWithProgress[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ManhwaWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'progress'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);

  // Получить текущего пользователя
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        router.push('/auth/login');
        return;
      }

      setUser(data.user);
    };

    getUser();
  }, [router]);

  // Загрузить историю чтения
  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) return;

      try {
        const { data: historyData, error } = await supabase
          .from('reading_history')
          .select('*')
          .eq('user_id', user.id)
          .order('read_at', { ascending: false });

        if (error) throw error;

        // Группировать по manhwa_id и получить последнюю главу для каждой
        const groupedHistory = new Map<string, ReadingHistory>();
        
        historyData?.forEach((item: ReadingHistory) => {
          if (!groupedHistory.has(item.manhwa_id)) {
            groupedHistory.set(item.manhwa_id, item);
          }
        });

        // Преобразовать в массив с информацией о манхве
        const historyWithDetails: ManhwaWithProgress[] = [];

        groupedHistory.forEach((item, manhwaId) => {
          const manhwa = getManhwaById(manhwaId);
          if (manhwa) {
            const chapter = manhwa.chapters.find(ch => ch.id === item.chapter_id);
            const totalPages = chapter?.pages.length || 0;
            const progress = totalPages > 0 ? (item.page_number / totalPages) * 100 : 0;

            historyWithDetails.push({
              id: manhwaId,
              title: manhwa.title,
              imageUrl: manhwa.imageUrl,
              currentChapter: chapter?.number.toString() || 'Unknown',
              currentPage: item.page_number,
              totalPages: totalPages,
              lastRead: new Date(item.read_at).toLocaleDateString('uk-UA'),
              progress: progress,
            });
          }
        });

        setHistory(historyWithDetails);
        setFilteredHistory(historyWithDetails);
      } catch (err) {
        console.error('Error loading history:', err);
        setError('Помилка при завантаженні історії');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.id]);

  // Фильтрация и сортировка
  useEffect(() => {
    let filtered = [...history];

    // Поиск
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Сортировка
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title, 'uk-UA'));
        break;
      case 'progress':
        filtered.sort((a, b) => b.progress - a.progress);
        break;
      case 'recent':
      default:
        // Уже отсортировано по дате в запросе
        break;
    }

    setFilteredHistory(filtered);
  }, [searchQuery, sortBy, history]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Завантаження історії...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-text-muted/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">Профіль</span>
          </Link>
          <h1 className="text-2xl font-bold">Історія читання</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Пошук манхв..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card-bg border border-text-muted/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg
              className="absolute right-4 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === 'recent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-card-bg border border-text-muted/20 text-gray-400 hover:border-blue-500/50'
              }`}
            >
              Недавні
            </button>
            <button
              onClick={() => setSortBy('alphabetical')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === 'alphabetical'
                  ? 'bg-blue-600 text-white'
                  : 'bg-card-bg border border-text-muted/20 text-gray-400 hover:border-blue-500/50'
              }`}
            >
              За назвою
            </button>
            <button
              onClick={() => setSortBy('progress')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === 'progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-card-bg border border-text-muted/20 text-gray-400 hover:border-blue-500/50'
              }`}
            >
              За прогресом
            </button>
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
            </svg>
            <p className="text-gray-400 text-lg mb-4">
              {searchQuery ? 'Манхви не знайдені' : 'Історія читання пуста'}
            </p>
            <Link href="/" className="text-blue-500 hover:text-blue-400">
              Почніть читати манхви
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((item) => (
              <Link key={item.id} href={`/manhwa/${item.id}`}>
                <div className="bg-card-bg rounded-lg border border-text-muted/20 overflow-hidden hover:border-blue-500/50 transition-colors cursor-pointer h-full flex flex-col">
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-900">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>

                    <div className="text-sm text-gray-400 mb-3">
                      <p>Розділ {item.currentChapter}</p>
                      <p className="text-xs">Сторінка {item.currentPage}/{item.totalPages}</p>
                      <p className="text-xs mt-1">Останній раз: {item.lastRead}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-auto">
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 text-right">
                        {Math.round(item.progress)}%
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Statistics */}
        {filteredHistory.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6">
              <p className="text-gray-400 text-sm mb-2">Всього в історії</p>
              <p className="text-3xl font-bold text-blue-500">{filteredHistory.length}</p>
            </div>

            <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6">
              <p className="text-gray-400 text-sm mb-2">Середній прогрес</p>
              <p className="text-3xl font-bold text-purple-500">
                {Math.round(
                  filteredHistory.reduce((sum, item) => sum + item.progress, 0) /
                    filteredHistory.length
                )}%
              </p>
            </div>

            <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6">
              <p className="text-gray-400 text-sm mb-2">Завершено</p>
              <p className="text-3xl font-bold text-green-500">
                {filteredHistory.filter(item => item.progress === 100).length}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}