/**
 * 📁 /app/admin/manhwa/[id]/page.tsx
 * 
 * ✏️ СТРАНИЦА РЕДАКТИРОВАНИЯ МАНХВЫ - ВСЕ В ОДНОМ
 * 
 * Показывает:
 *   СЛЕВА:
 *     - Обложка (можно загрузить/заменить)
 *     - Фон (можно загрузить/заменить)
 *     - Персонаж (можно загрузить/заменить)
 * 
 *   СПРАВА:
 *     - Название (редактируемое)
 *     - Описание (редактируемое)
 *     - Короткое описание
 *     - Плашка: Статус, Тип публикации, Тип
 *     - Теги (редактируемые)
 * 
 *   ВНИЗУ:
 *     - Список розділів с кнопками управления
 *     - Загрузка сторінок
 *     - Публикация/планирование
 * 
 * Использует API:
 *   - GET /api/admin/manhwa/:id
 *   - PUT /api/admin/manhwa/:id
 *   - POST /api/admin/upload
 *   - GET /api/admin/manhwa/:id/chapters
 *   - POST /api/admin/manhwa/:id/chapters
 *   - POST /api/admin/chapters/:id/upload-pages
 *   - PUT /api/admin/chapters/:id/publish
 *   - DELETE /api/admin/chapters/:id
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminGuard } from '@/components/AdminGuard';
import { EditableTitle } from '@/components/admin/EditableTitle';
import { EditableDescription } from '@/components/admin/EditableDescription';
import { EditableTags } from '@/components/admin/EditableTags';
import { EditableStatus } from '@/components/admin/EditableStatus';
import { ScheduleEditor, type ScheduleDay } from '@/components/admin/ScheduleEditor';

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
  description: string;
  short_description: string;
  status: string;
  rating: number;
  cover_image?: string;
  bg_image?: string;
  char_image?: string;
  publication_type?: 'censored' | 'uncensored';
  type?: 'manhwa' | 'manga' | 'manhua';
  tags: string[];
  schedule_day?: {
    dayBig: string;
    dayLabel: string;
    note: string;
  } | null;
  schedule_label?: string | null;
  schedule_note?: string | null;
}

type ModalType = 'none' | 'create' | 'upload' | 'publish';

export default function AdminManhwaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [manhwa, setManwhwa] = useState<Manhwa | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Модальные окна для розділів
  const [modal, setModal] = useState<ModalType>('none');
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  // Данные форм
  const [createFormData, setCreateFormData] = useState({ title: '', description: '' });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('12:00');

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      console.log('📖 [AdminDetail] Loading data...');
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
      let data = manhwaData.data;

      // Конвертировать schedule_label в schedule_day для отображения
      if (data.schedule_label) {
        const dayMapping: Record<string, string> = {
          'Понеділок': 'ПН',
          'Вівторок': 'ВТ',
          'Середа': 'СР',
          'Четвер': 'ЧТ',
          "П'ятниця": 'ПТ',
          'Субота': 'СБ',
          'Неділя': 'НД',
        };

        const dayBig = dayMapping[data.schedule_label] || '';
        if (dayBig) {
          data.schedule_day = {
            dayBig,
            dayLabel: data.schedule_label,
            note: data.schedule_note || '',
          };
        }
      }

      console.log('✅ Manhwa loaded:', data.title);
      setManwhwa(data);

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

  const handleUpdate = (field: string, value: any) => {
    if (manhwa) {
      setManwhwa((prev) => (prev ? { ...prev, [field]: value } : null));
      // Сохранить на сервер
      saveToServer(field, value);
    }
  };

  const saveToServer = async (field: string, value: any) => {
    try {
      if (!token) return;

      const payload: any = {};

      // Преобразовать название поля для API
      if (field === 'schedule_day') {
        if (value && value.dayLabel) {
          // value приходит из ScheduleEditor с dayBig, dayLabel и note
          payload.schedule_label = value.dayLabel;
          payload.schedule_note = value.note;
          console.log(`💾 Saving schedule:`, { label: value.dayLabel, note: value.note });
        } else {
          payload.schedule_label = null;
          payload.schedule_note = null;
          console.log(`💾 Clearing schedule`);
        }
      } else if (field === 'publication_type') {
        payload.publication_type = value;
        console.log(`💾 Saving publication_type:`, value);
      } else {
        payload[field] = value;
        console.log(`💾 Saving ${field}:`, value);
      }

      const res = await fetch(`/api/admin/manhwa/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(`❌ Failed to save ${field}:`, err);
        throw new Error(err.error || 'Save failed');
      }

      const result = await res.json();
      console.log(`✅ ${field} saved successfully`, result.data);
    } catch (err) {
      console.error(`❌ Error saving ${field}:`, err);
    }
  };

  const handleImageUpload = async (type: 'cover' | 'bg' | 'char', file: File) => {
    try {
      setUploading(true);
      setError(null);

      if (!token) throw new Error('No token');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('manhwaId', id);

      console.log('📤 Uploading image:', { type, fileName: file.name, size: file.size });

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload failed');
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      console.log('✅ Image uploaded:', imageUrl);

      // Сохранить на сервер
      const updateRes = await fetch(`/api/admin/manhwa/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [`${type}_image`]: imageUrl,
        }),
      });

      if (!updateRes.ok) throw new Error('Failed to update');

      const imageField = `${type}_image` as keyof Manhwa;
      setManwhwa((prev) => (prev ? { ...prev, [imageField]: imageUrl } : null));

      console.log(`✅ ${type} image updated`);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Помилка загрузки');
    } finally {
      setUploading(false);
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
    if (!confirm('Видалити цей розділ?')) return;

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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-text-muted">Завантаження...</p>
          </div>
        </div>
      </AdminGuard>
    );
  }

  if (error || !manhwa || !token) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-bg-main p-6">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push('/admin/manhwa')}
              className="mb-4 text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Назад
            </button>
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold text-red-500 mb-2">Помилка</h2>
              <p className="text-text-muted mb-4">{error || 'Манхву не знайдено'}</p>
            </div>
          </div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-bg-main">
        {/* Кнопка назад */}
        <div className="sticky top-0 z-40 bg-card-bg border-b border-text-muted/20 p-4">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.push('/admin/manhwa')}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Назад
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

            {/* ГЛАВНЫЙ КОНТЕНТ: Обложка + Информация */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* ЛЕВАЯ КОЛОНКА: Обложка, фон, персонаж */}
              <div className="lg:col-span-1 space-y-4">
                {/* Обложка */}
                <div
                  className="relative rounded-lg overflow-hidden border-2 border-dashed border-text-muted/50 hover:border-blue-500 transition-colors group cursor-pointer bg-gray-700 aspect-[3/4]"
                  onClick={() => document.getElementById('cover-input')?.click()}
                >
                  <input
                    id="cover-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('cover', file);
                    }}
                    className="hidden"
                  />
                  {manhwa.cover_image ? (
                    <>
                      <img
                        src={manhwa.cover_image}
                        alt={manhwa.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                          <div className="text-4xl mb-2">🔄</div>
                          <p className="text-white text-sm font-semibold">Замінити</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="text-4xl mb-2">📖</div>
                      <p className="text-text-muted text-sm font-semibold">Обкладинка</p>
                      <p className="text-text-muted text-xs mt-1">Клік для загрузки</p>
                    </div>
                  )}
                </div>

                {/* Фон */}
                <div
                  className="relative rounded-lg overflow-hidden border-2 border-dashed border-text-muted/50 hover:border-blue-500 transition-colors group cursor-pointer bg-gray-700 h-32"
                  onClick={() => document.getElementById('bg-input')?.click()}
                >
                  <input
                    id="bg-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('bg', file);
                    }}
                    className="hidden"
                  />
                  {manhwa.bg_image ? (
                    <>
                      <img
                        src={manhwa.bg_image}
                        alt="Background"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                          <div className="text-3xl mb-1">🔄</div>
                          <p className="text-white text-xs font-semibold">Замінити</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="text-3xl mb-1">🖼️</div>
                      <p className="text-text-muted text-xs font-semibold">Фон</p>
                      <p className="text-text-muted text-xs mt-0.5">Клік для загрузки</p>
                    </div>
                  )}
                </div>

                {/* Персонаж */}
                <div
                  className="relative rounded-lg overflow-hidden border-2 border-dashed border-text-muted/50 hover:border-blue-500 transition-colors group cursor-pointer bg-gray-700 aspect-square"
                  onClick={() => document.getElementById('char-input')?.click()}
                >
                  <input
                    id="char-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('char', file);
                    }}
                    className="hidden"
                  />
                  {manhwa.char_image ? (
                    <>
                      <img
                        src={manhwa.char_image}
                        alt="Character"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                          <div className="text-4xl mb-2">🔄</div>
                          <p className="text-white text-sm font-semibold">Замінити</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="text-4xl mb-2">👤</div>
                      <p className="text-text-muted text-sm font-semibold">Персонаж</p>
                      <p className="text-text-muted text-xs mt-1">Клік для загрузки</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ПРАВАЯ КОЛОНКА: Информация */}
              <div className="lg:col-span-2 space-y-6">
                {/* Название */}
                <div>
                  <EditableTitle
                    value={manhwa.title}
                    manhwaId={id}
                    token={token}
                    onUpdate={(value) => handleUpdate('title', value)}
                  />
                </div>

                {/* Описание */}
                <div className="bg-card-bg/50 p-4 rounded-lg border border-text-muted/20">
                  <p className="text-sm text-text-muted mb-2">Опис:</p>
                  <EditableDescription
                    value={manhwa.description}
                    manhwaId={id}
                    token={token}
                    onUpdate={(value) => handleUpdate('description', value)}
                  />
                </div>

                {/* Короткое описание */}
                <div className="bg-card-bg/50 p-4 rounded-lg border border-text-muted/20">
                  <p className="text-sm text-text-muted mb-2">Короткий опис:</p>
                  <p className="text-text-main">{manhwa.short_description || 'Не вказано'}</p>
                </div>

                {/* Плашка: Статус, тип цензури, тип */}
                <div className="bg-card-bg border border-text-muted/20 rounded-lg p-4 space-y-3">
                  {/* Статус */}
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Статус:</label>
                    <EditableStatus
                      value={manhwa.status}
                      manhwaId={id}
                      token={token}
                      onUpdate={(value) => handleUpdate('status', value)}
                    />
                  </div>

                  {/* Тип публікації */}
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Тип публікації:</label>
                    <select
                      value={manhwa.publication_type || 'uncensored'}
                      onChange={async (e) => {
                        try {
                          if (!token) throw new Error('No token');

                          const response = await fetch(`/api/admin/manhwa/${id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              publication_type: e.target.value,
                            }),
                          });

                          if (!response.ok) throw new Error('Failed to update');

                          handleUpdate('publication_type', e.target.value);
                        } catch (err) {
                          console.error('Error:', err);
                          setError('Помилка при оновленні');
                        }
                      }}
                      className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="uncensored">🔞 Без цензури</option>
                      <option value="censored">🔒 Цензурована</option>
                    </select>
                  </div>

                  {/* Тип */}
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Тип:</label>
                    <select
                      value={manhwa.type || 'manhwa'}
                      onChange={async (e) => {
                        try {
                          if (!token) throw new Error('No token');

                          const response = await fetch(`/api/admin/manhwa/${id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              type: e.target.value,
                            }),
                          });

                          if (!response.ok) throw new Error('Failed to update');

                          handleUpdate('type', e.target.value);
                        } catch (err) {
                          console.error('Error:', err);
                          setError('Помилка при оновленні');
                        }
                      }}
                      className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="manhwa">🇰🇷 Манхва</option>
                      <option value="manga">🇯🇵 Манга</option>
                      <option value="manhua">🇨🇳 Маньхуа</option>
                    </select>
                  </div>
                </div>

                {/* Теги */}
                <div className="bg-card-bg/50 p-4 rounded-lg border border-text-muted/20">
                  <p className="text-sm text-text-muted mb-2">Теги:</p>
                  <EditableTags
                    value={manhwa.tags}
                    manhwaId={id}
                    token={token}
                    onUpdate={(value) => handleUpdate('tags', value)}
                  />
                </div>

                {/* Расписание */}
                {manhwa && (
                  <div className="bg-card-bg/50 p-4 rounded-lg border border-text-muted/20">
                    <ScheduleEditor
                      scheduleDay={manhwa.schedule_day}
                      onSave={(schedule) => handleUpdate('schedule_day', schedule)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* РОЗДІЛИ: Управление главами */}
            <div className="bg-card-bg border border-text-muted/20 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-main">📚 Розділи</h2>
                <button
                  onClick={() => {
                    setModal('create');
                    setCreateFormData({ title: '', description: '' });
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  ➕ Завантажити розділ
                </button>
              </div>

              {/* Список розділів */}
              {chapters.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <p className="mb-4">Поки немає розділів</p>
                  <button
                    onClick={() => {
                      setModal('create');
                      setCreateFormData({ title: '', description: '' });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    ➕ Завантажити розділ
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="group p-4 bg-bg-main border border-text-muted/20 rounded-lg hover:border-blue-500 transition-all"
                    >
                      <div className="flex items-center justify-between gap-4">
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
        </div>

        {/* МОДАЛЬ: Создание розділа */}
        {modal === 'create' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card-bg border border-text-muted/20 rounded-xl w-full max-w-md">
              <div className="border-b border-text-muted/20 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-main">➕ Новий розділ</h2>
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
                    {uploading ? '⏳ Створення...' : '➕ Створити'}
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