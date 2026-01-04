// app/admin/page.tsx
// ✅ УПРОЩЕНА версия - перевірка доступу вже на сервері!

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/auth';
import { AddManhwaModal } from '@/components/admin/AddManhwaModal';

// ✅ ИСПРАВЛЕНИЕ: Динамический рендер (для Server Actions в getAccessToken)
export const dynamic = 'force-dynamic';

interface Manhwa {
  id: string;
  title: string;
  description: string;
  status: string;
  rating: number;
  cover_image?: string;
  tags: string[];
}

export default function AdminManhwaPage() {
  const router = useRouter();
  const [manhwas, setManhwas] = useState<Manhwa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    loadManhwas();
  }, []);

  const loadManhwas = async () => {
    try {
      console.log('📚 [AdminPage] Loading manhwas...');
      setLoading(true);

      // ✅ Получаем токен через Server Action
      const accessToken = await getAccessToken();

      if (!accessToken) {
        console.error('❌ [AdminPage] No token found');
        return;
      }

      console.log('🔑 [AdminPage] Token obtained');
      setToken(accessToken);

      // ✅ Запрос до API
      const response = await fetch('/api/admin/manhwa', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load manhwas');
      }

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-text-muted">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main p-6">
      <div className="max-w-7xl mx-auto">
        {/* Шапка */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-text-main">⚙️ Адмін-панель</h1>
            <p className="text-text-muted mt-2">Управління манхвами</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
          >
            ➕ Нова манхва
          </button>
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
      </div>
    </div>
  );
}