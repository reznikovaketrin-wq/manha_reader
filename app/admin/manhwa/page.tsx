/**
 * 📁 /app/admin/manhwa/page.tsx
 * 
 * 🏠 ГЛАВНАЯ СТРАНИЦА АДМИНКИ - ГАЛЕРЕЯ ОБЛОЖЕК
 * 
 * Показывает:
 *   - Все манхвы как красивую галерею (обложки)
 *   - Кнопку добавления новой манхвы
 *   - При клике на обложку → переход на редактирование
 * 
 * Использует API:
 *   - GET /api/admin/manhwa (получить список)
 *   - DELETE /api/admin/manhwa/:id (удалить)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminGuard } from '@/components/AdminGuard';
import { AddManhwaModal } from '@/components/admin/AddManhwaModal';

interface Manhwa {
  id: string;
  title: string;
  description: string;
  status: string;
  rating: number;
  cover_image?: string;
  tags: string[];
  schedule_day?: {
    dayBig: string;
    dayLabel: string;
    note: string;
  } | null;
}

export default function AdminManhwaPage() {
  const router = useRouter();
  const [manhwas, setManhwas] = useState<Manhwa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) throw new Error('No token');

      const response = await fetch('/api/admin/sync-r2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Sync failed');

      setSyncResult({ success: true, data });
      
      // Перезагрузить список манхв
      setTimeout(() => {
        loadManhwas();
      }, 1000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setSyncing(false);
    }
  };
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    loadManhwas();
  }, []);

  const loadManhwas = async () => {
    try {
      console.log('📚 [AdminPage] Loading manhwas...');
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) throw new Error('No token');

      setToken(accessToken);

      const response = await fetch('/api/admin/manhwa', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load');

      const data = await response.json();
      console.log('✅ [AdminPage] Loaded manhwas:', data.data.length);
      setManhwas(data.data);
    } catch (error) {
      console.error('❌ [AdminPage] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManhwaCreated = (newManhwa: Manhwa) => {
    setManhwas((prev) => [newManhwa, ...prev]);
    setShowModal(false);
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-text-muted">Завантаження...</p>
          </div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-main p-6">
        <div className="max-w-7xl mx-auto">
          {/* Шапка */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold text-text-main">⚙️ Адмін-панель</h1>
              <p className="text-text-muted mt-2">Управління манхвами</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Синхронізація...
                  </>
                ) : (
                  <>
                    🔄 Синхронізувати R2
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
              >
                ➕ Нова манхва
              </button>
            </div>
          </div>

          {/* Модаль добавления */}
          {showModal && token && (
            <AddManhwaModal
              token={token}
              onManhwaCreated={handleManhwaCreated}
              onClose={() => setShowModal(false)}
            />
          )}

          {/* Галерея обложек */}
          {manhwas.length === 0 ? (
            <div className="text-center py-20 text-text-muted">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-xl mb-4">Поки немає манхв</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Створіть першу!
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {manhwas.map((manhwa) => (
                <button
                  key={manhwa.id}
                  onClick={() => router.push(`/admin/manhwa/${manhwa.id}`)}
                  className="group flex flex-col gap-2 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
                >
                  {/* Обложка */}
                  <div className="relative overflow-hidden rounded-lg bg-gray-700 aspect-[3/4] shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
                    {manhwa.cover_image ? (
                      <img
                        src={manhwa.cover_image}
                        alt={manhwa.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:brightness-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        📚
                      </div>
                    )}

                    {/* Рейтинг в углу */}
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur px-2 py-1 rounded-full">
                      <span className="text-yellow-400 font-bold text-xs">⭐ {manhwa.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Название внизу */}
                  <p className="text-sm font-semibold text-text-main line-clamp-2 text-center">
                    {manhwa.title}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Статистика внизу */}
          {manhwas.length > 0 && (
            <div className="mt-12 pt-6 border-t border-text-muted/20 text-center text-text-muted">
              <p className="text-sm">
                ✅ Всього манхв: <span className="font-bold text-text-main text-lg">{manhwas.length}</span>
              </p>
            </div>
          )}

          {/* Модаль результата синхронизации */}
          {syncResult && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className={`${syncResult.success ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'} border rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto`}>
                <div className="border-b border-current p-6 flex justify-between items-center">
                  <h2 className={`text-2xl font-bold ${syncResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {syncResult.success ? '✅ Синхронізація завершена!' : '❌ Помилка синхронізації'}
                  </h2>
                  <button
                    onClick={() => setSyncResult(null)}
                    className="text-text-muted hover:text-text-main text-2xl transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {syncResult.success ? (
                    <>
                      <div className="space-y-2 text-sm text-text-main">
                        <p>📚 Манхв обработано: <strong>{syncResult.data.results.manhwasProcessed}</strong></p>
                        <p>📖 Розділів создано: <strong>{syncResult.data.results.chaptersCreated}</strong></p>
                        <p>📄 Сторінок создано: <strong>{syncResult.data.results.pagesCreated}</strong></p>
                        <p>🖼️ Изображений обновлено: <strong>{syncResult.data.results.imagesUpdated}</strong></p>
                      </div>
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs">
                        ✅ {syncResult.data.message}
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                      ❌ {syncResult.error}
                    </div>
                  )}
                </div>

                <div className="p-6 flex gap-3 border-t border-current">
                  <button
                    onClick={() => setSyncResult(null)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Закрити
                  </button>
                  {syncResult.success && (
                    <button
                      onClick={() => {
                        setSyncResult(null);
                        location.reload();
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Перезагрузити
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}