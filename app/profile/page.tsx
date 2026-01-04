'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/app/providers/UserProvider';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase-client';

interface ReadingStats {
  totalManhwa: number;
  totalChapters: number;
  totalTimeSpent: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [stats, setStats] = useState<ReadingStats>({
    totalManhwa: 0,
    totalChapters: 0,
    totalTimeSpent: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  // ✅ Загружаємо статистику
  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        const { data: historyData, error: historyError } = await supabase
          .from('reading_history')
          .select('*')
          .eq('user_id', user.id);

        if (!historyError && historyData) {
          const uniqueManhwa = new Set(historyData.map((h: any) => h.manhwa_id)).size;
          const totalChapters = historyData.length;
          const timeSpent = totalChapters * 5;

          setStats({
            totalManhwa: uniqueManhwa,
            totalChapters: totalChapters,
            totalTimeSpent: timeSpent,
          });
        }
      } catch (err) {
        console.error('Error loading stats:', err);
        setError('Помилка при завантаженні статистики');
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [user]);

  // ✅ LOGOUT - БЕЗ ручного setUser!
  const handleLogout = async () => {
    try {
      console.log('🔐 [Profile] Signing out...');
      
      const result = await signOut();
      
      if (result.success) {
        console.log('✅ [Profile] Sign out successful');
        console.log('🔔 [Profile] UserProvider will sync automatically via onAuthStateChange');
        
        // ❌ УБРАЛИ: setUser(null);
        // ✅ UserProvider сам обновит через onAuthStateChange!
        
        setTimeout(() => {
          router.push('/');
        }, 300);
      } else {
        alert('Помилка при виході. Спробуйте ще раз.');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Неочікувана помилка');
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Завантаження профілю...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Помилка завантаження профілю'}</p>
          <Link href="/" className="text-blue-500 hover:text-blue-400">
            Повернутися на головну
          </Link>
        </div>
      </div>
    );
  }

  const fullName = user.user_metadata?.username || user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-text-muted/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">Назад</span>
          </Link>
          <h1 className="text-2xl font-bold">Мій Профіль</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-card-bg rounded-lg border border-text-muted/20 p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-4xl font-bold">{fullName[0].toUpperCase()}</span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{fullName}</h2>
              <p className="text-gray-400 mb-6">{user.email}</p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold"
                >
                  Вийти з облікового запису
                </button>
                <Link
                  href="/profile/settings"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold inline-block"
                >
                  Налаштування
                </Link>
              </div>

              <div className="text-sm text-gray-400">
                <p>ID: {user.id}</p>
                <p>Статус: Активний користувач</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Manhwa */}
          <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6">
            <div className="text-gray-400 text-sm mb-2">Прочитано манхви</div>
            <div className="text-4xl font-bold text-blue-500 mb-2">{stats.totalManhwa}</div>
            <div className="text-gray-400 text-xs">Унікальних творів</div>
          </div>

          {/* Total Chapters */}
          <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6">
            <div className="text-gray-400 text-sm mb-2">Прочитано розділів</div>
            <div className="text-4xl font-bold text-purple-500 mb-2">{stats.totalChapters}</div>
            <div className="text-gray-400 text-xs">Всього глав</div>
          </div>

          {/* Time Spent */}
          <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6">
            <div className="text-gray-400 text-sm mb-2">Час у читанні</div>
            <div className="text-4xl font-bold text-green-500 mb-2">
              {Math.floor(stats.totalTimeSpent / 60)}ч {stats.totalTimeSpent % 60}м
            </div>
            <div className="text-gray-400 text-xs">Всього часу</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reading History */}
          <Link href="/profile/reading-history">
            <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6 hover:border-blue-500/50 transition-colors cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Історія читання</h3>
                  <p className="text-sm text-gray-400">Перегляньте всі прочитані манхви</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Favorites */}
          <Link href="/profile/favorites">
            <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6 hover:border-purple-500/50 transition-colors cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Улюблені</h3>
                  <p className="text-sm text-gray-400">Ваші улюблені манхви</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Account Settings Section */}
        <div className="mt-8 bg-card-bg rounded-lg border border-text-muted/20 p-6">
          <h3 className="text-xl font-semibold mb-4">Параметри облікового запису</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-text-muted/20">
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
              <button className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors text-sm">
                Змінити
              </button>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-text-muted/20">
              <div>
                <p className="font-semibold">Пароль</p>
                <p className="text-sm text-gray-400">Останнім разом змінено давно</p>
              </div>
              <button className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors text-sm">
                Змінити
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-semibold">Двофакторна аутентифікація</p>
                <p className="text-sm text-gray-400">Додаткова безпека вашого облікового запису</p>
              </div>
              <button className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors text-sm">
                Увімкнути
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}