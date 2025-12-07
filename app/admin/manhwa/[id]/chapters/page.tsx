'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminGuard } from '@/components/AdminGuard';

interface Chapter {
  id: number;
  chapter_id: string;
  chapter_number: number;
  title: string;
  description: string;
  pages_count: number;
  status: 'draft' | 'scheduled' | 'published';
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
}

interface Manhwa {
  id: string;
  title: string;
  cover_image: string;
}

type ModalType = 'none' | 'create' | 'upload' | 'publish';

export default function AdminChaptersPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [manhwa, setManwhwa] = useState<Manhwa | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Модальные окна
  const [modal, setModal] = useState<ModalType>('none');
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  // Данные форм
  const [createFormData, setCreateFormData] = useState({ title: '', description: '' });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('12:00');

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      console.log('📚 [ChaptersPage] Loading data...');
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) throw new Error('No token');

      setToken(accessToken);

      // Загрузить манхву
      const manhwaRes = await fetch(`/api/admin/manhwa/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!manhwaRes.ok) throw new Error('Failed to load manhwa');

      const manhwaData = await manhwaRes.json();
      setManwhwa(manhwaData.data);

      // Загрузить главы
      const chaptersRes = await fetch(`/api/admin/manhwa/${id}/chapters`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!chaptersRes.ok) throw new Error('Failed to load chapters');

      const chaptersData = await chaptersRes.json();
      setChapters(chaptersData.data);

      console.log('✅ Data loaded');
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUploading(true);
      setError(null);

      if (!token) throw new Error('No token');

      const response = await fetch(`/api/admin/manhwa/${id}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createFormData),
      });

      if (!response.ok) throw new Error('Failed to create');

      const data = await response.json();
      setChapters((prev) => [...prev, data.data]);
      setCreateFormData({ title: '', description: '' });
      setModal('none');

      console.log('✅ Chapter created');
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadPages = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeChapter || uploadFiles.length === 0) {
      setError('Виберіть файли');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      if (!token) throw new Error('No token');

      const formData = new FormData();
      uploadFiles.forEach((file) => {
        formData.append('pages', file);
      });
      formData.append('manhwaId', id);
      formData.append('chapterNumber', activeChapter.chapter_id);

      const response = await fetch(`/api/admin/chapters/${activeChapter.id}/upload-pages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      // Оновити главу з новим кількістю сторінок
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === activeChapter.id ? { ...ch, pages_count: uploadFiles.length } : ch
        )
      );

      setUploadFiles([]);
      setModal('none');

      console.log('✅ Pages uploaded');
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setUploading(false);
    }
  };

  const handlePublishChapter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeChapter) return;

    if (publishMode === 'schedule' && !publishDate) {
      setError('Виберіть дату');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      if (!token) throw new Error('No token');

      const body =
        publishMode === 'now'
          ? { action: 'publish' }
          : {
              action: 'schedule',
              scheduledAt: new Date(`${publishDate}T${publishTime}`).toISOString(),
            };

      const response = await fetch(`/api/admin/chapters/${activeChapter.id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Publish failed');

      const data = await response.json();

      // Оновити главу
      setChapters((prev) =>
        prev.map((ch) => (ch.id === activeChapter.id ? data.data : ch))
      );

      setModal('none');
      setPublishDate('');
      setPublishTime('12:00');
      setPublishMode('now');

      console.log('✅ Chapter published');
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!confirm('Видалити цю главу?')) return;

    try {
      if (!token) throw new Error('No token');

      const response = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Delete failed');

      setChapters((prev) => prev.filter((ch) => ch.id !== chapterId));

      console.log('✅ Chapter deleted');
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Помилка при видаленні');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-gray-600', text: 'text-gray-100', label: 'Чернетка' },
      scheduled: { bg: 'bg-yellow-600', text: 'text-yellow-100', label: 'Запланована' },
      published: { bg: 'bg-green-600', text: 'text-green-100', label: 'Опублікована' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-main">
        {/* Шапка */}
        <div className="sticky top-0 z-30 bg-card-bg border-b border-text-muted/20 p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/manhwa')}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                ← Назад
              </button>
              <div>
                <h1 className="text-2xl font-bold text-text-main">{manhwa?.title}</h1>
                <p className="text-sm text-text-muted">Управління розділами</p>
              </div>
            </div>

            <button
              onClick={() => {
                setModal('create');
                setCreateFormData({ title: '', description: '' });
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
            >
               Додати розділ
            </button>
          </div>
        </div>

        {/* Основной контент */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Ошибка */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {/* Список глав */}
            {chapters.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-xl text-text-main mb-2">Поки немає розділів</p>
                <p className="text-text-muted mb-6">Створіть перший розділ</p>
                <button
                  onClick={() => setModal('create')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                   Додати розділ
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="group p-4 bg-card-bg border border-text-muted/20 rounded-lg hover:border-blue-500 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Информация главы */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-text-main">
                            Розділ {chapter.chapter_number}
                          </h3>
                          {getStatusBadge(chapter.status)}
                        </div>

                        <p className="text-sm text-text-muted mb-2">{chapter.description}</p>

                        <div className="flex gap-4 text-sm text-text-muted">
                          <span>📄 {chapter.pages_count} сторінок</span>
                          <span>📅 {new Date(chapter.created_at).toLocaleDateString('uk-UA')}</span>
                          {chapter.status === 'scheduled' && (
                            <span className="text-yellow-400">
                              ⏰ {new Date(chapter.scheduled_at!).toLocaleString('uk-UA')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Кнопки */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setActiveChapter(chapter);
                            setModal('upload');
                            setUploadFiles([]);
                          }}
                          disabled={uploading}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                        >
                          📤 Сторінки
                        </button>

                        <button
                          onClick={() => {
                            setActiveChapter(chapter);
                            setModal('publish');
                            setPublishDate('');
                            setPublishTime('12:00');
                          }}
                          disabled={uploading || chapter.pages_count === 0}
                          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                          title={chapter.pages_count === 0 ? 'Спочатку завантажте сторінки' : ''}
                        >
                          ⏰ Публікація
                        </button>

                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          disabled={uploading}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* МОДАЛЬ: Создание главы */}
        {modal === 'create' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card-bg border border-text-muted/20 rounded-xl w-full max-w-md">
              <div className="border-b border-text-muted/20 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-main"> Новий розділ</h2>
                <button
                  onClick={() => setModal('none')}
                  className="text-text-muted hover:text-text-main text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateChapter} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">Назва</label>
                  <input
                    type="text"
                    value={createFormData.title}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Наприклад: Початок авантюри"
                    className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">Опис</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Опис..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading ? '⏳ Створення...' : ' Створити'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal('none')}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* МОДАЛЬ: Загрузка сторінок */}
        {modal === 'upload' && activeChapter && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card-bg border border-text-muted/20 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 border-b border-text-muted/20 p-6 flex justify-between items-center bg-card-bg">
                <h2 className="text-2xl font-bold text-text-main">📤 Сторінки: Розділ {activeChapter.chapter_number}</h2>
                <button
                  onClick={() => setModal('none')}
                  className="text-text-muted hover:text-text-main text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadPages} className="p-6 space-y-4">
                <div
                  className="p-8 border-2 border-dashed border-text-muted/50 rounded-lg text-center cursor-pointer hover:border-text-muted/80 transition-colors"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-text-main font-medium mb-1">Перетягніть сюди зображення</p>
                  <p className="text-sm text-text-muted">або клікніть для вибору</p>
                </div>

                {uploadFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {uploadFiles.map((file, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Page ${i + 1}`}
                          className="w-full h-24 object-cover rounded border border-text-muted/20"
                        />
                        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {i + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center bg-black/50 rounded transition-opacity"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading || uploadFiles.length === 0}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading ? '⏳ Завантаження...' : `📤 Завантажити (${uploadFiles.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal('none')}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* МОДАЛЬ: Публикация */}
        {modal === 'publish' && activeChapter && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card-bg border border-text-muted/20 rounded-xl w-full max-w-md">
              <div className="border-b border-text-muted/20 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-main">⏰ Публікація</h2>
                <button
                  onClick={() => setModal('none')}
                  className="text-text-muted hover:text-text-main text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePublishChapter} className="p-6 space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-text-muted/20 rounded-lg cursor-pointer hover:bg-card-hover transition-colors">
                    <input
                      type="radio"
                      name="mode"
                      value="now"
                      checked={publishMode === 'now'}
                      onChange={() => setPublishMode('now')}
                      className="w-4 h-4"
                    />
                    <span className="text-text-main font-medium">📤 Опублікувати зараз</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-text-muted/20 rounded-lg cursor-pointer hover:bg-card-hover transition-colors">
                    <input
                      type="radio"
                      name="mode"
                      value="schedule"
                      checked={publishMode === 'schedule'}
                      onChange={() => setPublishMode('schedule')}
                      className="w-4 h-4"
                    />
                    <span className="text-text-main font-medium">⏰ Запланувати</span>
                  </label>
                </div>

                {publishMode === 'schedule' && (
                  <div className="p-4 bg-card-hover rounded-lg space-y-3 border border-yellow-500/30">
                    <div>
                      <label className="block text-sm font-medium text-text-main mb-2">Дата</label>
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                        className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-main mb-2">Час</label>
                      <input
                        type="time"
                        value={publishTime}
                        onChange={(e) => setPublishTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {activeChapter.pages_count === 0 && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded text-yellow-600 text-sm">
                    ⚠️ Спочатку завантажте хоча б одну сторінку
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading || (publishMode === 'schedule' && !publishDate) || activeChapter.pages_count === 0}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading
                      ? '⏳...'
                      : publishMode === 'now'
                      ? '📤 Опублікувати'
                      : '⏰ Запланувати'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal('none')}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Скасувати
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}