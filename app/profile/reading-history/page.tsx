'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getManhwaById } from '@/data/manhwa';
import { User } from '@supabase/supabase-js';

interface ReadingHistoryRow {
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
  progress: number;
}

export default function ReadingHistoryPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<ManhwaWithProgress[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ManhwaWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'progress'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  // Получение пользователя
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/auth/login');
        return;
      }
      setUser(data.user);
    };

    loadUser();
  }, [router]);

  // Загрузка истории
  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
      setLoading(true);

      const { data } = await supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', user.id)
        .order('read_at', { ascending: false });

      if (!data) {
        setLoading(false);
        return;
      }

      const unique = new Map<string, ReadingHistoryRow>();

      data.forEach((item: ReadingHistoryRow) => {
        if (!unique.has(item.manhwa_id)) {
          unique.set(item.manhwa_id, item);
        }
      });

      const result = await Promise.all(
        [...unique.entries()].map(async ([manhwaId, item]) => {
          const manhwa = await getManhwaById(manhwaId);
          if (!manhwa) return null;

          const chapter = manhwa.chapters.find(
            (ch) => ch.id === item.chapter_id
          );

          const totalPages = chapter?.pagesCount || 0;

          return {
            id: manhwaId,
            title: manhwa.title,
            imageUrl: manhwa.coverImage || '/placeholder.png',
            currentChapter: chapter?.number.toString() || '—',
            currentPage: item.page_number,
            totalPages,
            lastRead: new Date(item.read_at).toLocaleDateString('uk-UA'),
            progress:
              totalPages > 0
                ? (item.page_number / totalPages) * 100
                : 0,
          };
        })
      );

      const clean = result.filter(Boolean) as ManhwaWithProgress[];
      setHistory(clean);
      setFilteredHistory(clean);
      setLoading(false);
    };

    loadHistory();
  }, [user]);

  // Фильтрация и сортировка
  useEffect(() => {
    let data = [...history];

    if (searchQuery) {
      data = data.filter((i) =>
        i.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === 'alphabetical') {
      data.sort((a, b) => a.title.localeCompare(b.title, 'uk-UA'));
    }

    if (sortBy === 'progress') {
      data.sort((a, b) => b.progress - a.progress);
    }

    setFilteredHistory(data);
  }, [searchQuery, sortBy, history]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Завантаження...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Історія читання</h1>

      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Пошук..."
        className="mb-6 w-full p-3 rounded bg-card-bg"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredHistory.map((item) => (
          <Link key={item.id} href={`/manhwa/${item.id}`}>
            <div className="bg-card-bg rounded-lg overflow-hidden border border-text-muted/20 hover:border-blue-500/50">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full aspect-[3/4] object-cover"
              />

              <div className="p-4">
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">
                  Розділ {item.currentChapter}
                </p>

                <div className="mt-3 h-2 bg-gray-700 rounded">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                <p className="text-xs text-right mt-1">
                  {Math.round(item.progress)}%
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
