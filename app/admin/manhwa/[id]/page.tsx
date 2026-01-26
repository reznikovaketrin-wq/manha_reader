'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/app/providers/UserProvider';
import { getAccessToken } from '@/lib/auth';
import { EditableTitle } from '@/components/admin/EditableTitle';
import { EditableDescription } from '@/components/admin/EditableDescription';
import { EditableTags } from '@/components/admin/EditableTags';
import { EditableStatus } from '@/components/admin/EditableStatus';
import { ScheduleEditor, type ScheduleDay } from '@/components/admin/ScheduleEditor';
import { invalidateManhwaCache } from '@/app/admin/server-actions';

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
  vip_only?: boolean;
  vip_early_days?: number;
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
  const { user, loading: userLoading } = useUser();

  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalType>('none');
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  const [createFormData, setCreateFormData] = useState({ 
    title: '', 
    description: '',
    vip_only: false,
    vip_early_days: 0,
  });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('12:00');
  const [publishVipOnly, setPublishVipOnly] = useState(false);
  const [publishVipEarlyDays, setPublishVipEarlyDays] = useState(0);

  const [uploading, setUploading] = useState(false);

  // ✅ Загружаем токен и данные
  useEffect(() => {
    if (!userLoading && id) {
      loadToken();
    }
  }, [userLoading, id]);

  const loadToken = async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError('Не авторизовано');
        router.push('/auth');
        return;
      }
      setToken(accessToken);
      loadData(accessToken);
    } catch (err) {
      console.error('Error getting token:', err);
      setError('Помилка авторизації');
    }
  };

  const loadData = async (accessToken: string) => {
    try {
      console.log('📖 [AdminDetail] Loading data...');
      setLoading(true);

      const manhwaRes = await fetch(`/api/admin/manhwa/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!manhwaRes.ok) throw new Error('Failed to load manhwa');

      const manhwaData = await manhwaRes.json();
      let data = manhwaData.data;

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
      setManhwa(data);

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
      setManhwa((prev: Manhwa | null) => prev ? { ...prev, [field]: value } : null);
      saveToServer(field, value);
    }
  };

  const saveToServer = async (field: string, value: any) => {
    try {
      if (!token) return;

      const payload: any = {};

      if (field === 'schedule_day') {
        if (value && value.dayLabel) {
          payload.schedule_label = value.dayLabel;
          payload.schedule_note = value.note || '';
          console.log(`💾 Saving schedule:`, { 
            dayLabel: value.dayLabel,
            note: value.note,
          });
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
      console.log(`✅ ${field} saved successfully`);

      await invalidateManhwaCache(id);

      if (field === 'schedule_day' && result.data) {
        const dayMapping: Record<string, string> = {
          'Понеділок': 'ПН',
          'Вівторок': 'ВТ',
          'Середа': 'СР',
          'Четвер': 'ЧТ',
          "П'ятниця": 'ПТ',
          'Субота': 'СБ',
          'Неділя': 'НД',
        };

        let updatedScheduleDay = null;
        if (result.data.schedule_label) {
          const dayBig = dayMapping[result.data.schedule_label] || '';
          if (dayBig) {
            updatedScheduleDay = {
              dayBig,
              dayLabel: result.data.schedule_label,
              note: result.data.schedule_note || '',
            };
          }
        }

        setManhwa((prev) =>
          prev
            ? {
                ...prev,
                schedule_day: updatedScheduleDay,
                schedule_label: result.data.schedule_label,
                schedule_note: result.data.schedule_note,
              }
            : null
        );
      }
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
      setManhwa((prev) => (prev ? { ...prev, [imageField]: imageUrl } : null));

      await invalidateManhwaCache(id);

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
        body: JSON.stringify({
          title: createFormData.title,
          description: createFormData.description,
          vip_only: createFormData.vip_only,
          vip_early_days: createFormData.vip_early_days,
        }),
      });

      if (!response.ok) throw new Error('Failed to create');

      const data = await response.json();
      setChapters((prev) => [...prev, data.data]);
      setCreateFormData({ title: '', description: '', vip_only: false, vip_early_days: 0 });
      setModal('none');
      await invalidateManhwaCache(id);
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

      console.log(`📤 Початок завантаження ${uploadFiles.length} файлів (presigned URLs)...`);

      // 1️⃣ Генерація presigned URLs для всіх файлів
      const filesInfo = uploadFiles.map((file, index) => ({
        pageNumber: index + 1,
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
      }));

      const presignedResponse = await fetch(`/api/admin/chapters/${activeChapter.id}/generate-presigned-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          manhwaId: id,
          chapterNumber: activeChapter.chapter_id,
          files: filesInfo,
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate presigned URLs');
      }

      const { presignedUrls } = await presignedResponse.json();
      console.log(`✅ Отримано ${presignedUrls.length} presigned URLs`);

      // 2️⃣ Прямо завантажити кожен файл в R2 через presigned URL
      const uploadedPages: Array<{ pageNumber: number; filePath: string }> = [];
      const batchSize = 5; // Завантажуємо по 5 файлів паралельно

      for (let i = 0; i < uploadFiles.length; i += batchSize) {
        const batch = uploadFiles.slice(i, i + batchSize);

        const batchPromises = batch.map(async (file, batchIndex) => {
          const index = i + batchIndex;
          const presignedData = presignedUrls[index];

          // PUT файл напряму в R2
          const uploadResponse = await fetch(presignedData.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type || 'image/jpeg',
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name} to R2 (status: ${uploadResponse.status})`);
          }

          uploadedPages.push({
            pageNumber: presignedData.pageNumber,
            filePath: presignedData.filePath,
          });

          console.log(`✅ Файл ${index + 1}/${uploadFiles.length}: ${file.name}`);
        });

        await Promise.all(batchPromises);
        console.log(`✅ Завантажено ${Math.min(i + batchSize, uploadFiles.length)} з ${uploadFiles.length} файлів`);
      }

      // 3️⃣ Зберегти метаданні в БД
      const saveResponse = await fetch(`/api/admin/chapters/${activeChapter.id}/save-uploaded-pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uploadedPages,
          isFirstBatch: true,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save page metadata');
      }

      const { totalPages } = await saveResponse.json();
      console.log(`✅ Метаданні збережено. Всього сторінок: ${totalPages}`);

      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === activeChapter.id ? { ...ch, pages_count: totalPages } : ch
        )
      );

      setUploadFiles([]);
      setModal('none');
      await invalidateManhwaCache(id);
      console.log('✅ Всі файли завантажено успішно через presigned URLs!');
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Помилка завантаження');
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

      if (publishMode === 'now') {
        const body = { 
          action: 'publish',
          vip_only: publishVipOnly,
          vip_early_days: publishVipEarlyDays,
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
        setPublishVipOnly(false);
        setPublishVipEarlyDays(0);
        await invalidateManhwaCache(id);
        console.log('✅ Chapter published now');
      } else {
        const [year, month, day] = publishDate.split('-');
        const [hours, minutes] = publishTime.split(':');
        
        const utcDate = new Date(Date.UTC(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          0,
          0
        ));
        
        const scheduledAtISO = utcDate.toISOString();
        
        console.log('📅 Publish scheduled:', {
          userInput: { date: publishDate, time: publishTime },
          utcTime: scheduledAtISO,
        });

        const body = {
          action: 'schedule',
          scheduledAt: scheduledAtISO,
          vip_only: publishVipOnly,
          vip_early_days: publishVipEarlyDays,
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
        setPublishVipOnly(false);
        setPublishVipEarlyDays(0);
        await invalidateManhwaCache(id);
        console.log('✅ Chapter scheduled for publication');
      }
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
      await invalidateManhwaCache(id);
      console.log('✅ Chapter deleted');
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Помилка при видаленні');
    }
  };

  const handleDeleteManhwa = async () => {
    if (!confirm('⚠️ ВИДАЛИТИ ЦЮ МАНГУ ПОВНІСТЮ? Це незворотна дія!')) return;
    if (!confirm('🔴 ВИ ВПЕВНЕНІ? ВСІ РОЗДІЛИ ТА ДАНІ БУДУТЬ ВИДАЛЕНІ!')) return;

    try {
      if (!token) throw new Error('No token');

      const response = await fetch(`/api/admin/manhwa/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Delete failed');

      console.log('✅ Manhwa deleted successfully');
      await invalidateManhwaCache(id);
      
      router.push('/admin/manhwa');
    } catch (err) {
      console.error('❌ Error deleting manhwa:', err);
      alert('Помилка при видаленні манги');
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

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gradient mx-auto mb-4"></div>
          <p className="text-text-muted">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (error || !manhwa || !token) {
    return (
      <div className="min-h-screen bg-bg-main p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/admin/manhwa')}
            className="mb-4 relative px-4 py-2 bg-black text-white rounded-lg overflow-hidden font-medium"
            style={{
              background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
              border: '2px solid transparent',
            }}
          >
            ← Назад
          </button>
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Помилка</h2>
            <p className="text-text-muted mb-4">{error || 'Манхву не знайдено'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-bg-main">
        <div className="sticky top-0 z-40 bg-card-bg border-b border-text-muted/20 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button
              onClick={() => router.push('/admin/manhwa')}
              className="relative px-4 py-2 bg-black text-white rounded-lg overflow-hidden font-medium"
              style={{
                background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                border: '2px solid transparent',
              }}
            >
              ← Назад
            </button>
            
            <button
              onClick={handleDeleteManhwa}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              🗑️ Видалити мангу
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-1 space-y-4">
                <div
                  className="relative rounded-lg overflow-hidden border-2 border-dashed border-text-muted/50 hover:border-accent-gradient transition-colors group cursor-pointer bg-gray-700 aspect-[3/4]"
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

                <div
                  className="relative rounded-lg overflow-hidden border-2 border-dashed border-text-muted/50 hover:border-accent-gradient transition-colors group cursor-pointer bg-gray-700 h-32"
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

                <div
                  className="relative rounded-lg overflow-hidden border-2 border-dashed border-text-muted/50 hover:border-accent-gradient transition-colors group cursor-pointer bg-gray-700 aspect-square"
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

              <div className="lg:col-span-2 space-y-6">
                <div>
                  <EditableTitle
                    value={manhwa.title}
                    manhwaId={id}
                    token={token}
                    onUpdate={(value) => handleUpdate('title', value)}
                  />
                </div>

                <div className="bg-card-bg/50 p-4 rounded-lg border border-text-muted/20">
                  <p className="text-sm text-text-muted mb-2">Опис:</p>
                  <EditableDescription
                    value={manhwa.description}
                    manhwaId={id}
                    token={token}
                    onUpdate={(value) => handleUpdate('description', value)}
                  />
                </div>

                <div className="bg-card-bg/50 p-4 rounded-lg border border-text-muted/20">
                  <p className="text-sm text-text-muted mb-2">Короткий опис:</p>
                  <EditableDescription
                    value={manhwa.short_description}
                    fieldName="short_description"
                    manhwaId={id}
                    token={token}
                    onUpdate={(value) => handleUpdate('short_description', value)}
                  />
                </div>

                <div className="bg-card-bg border border-text-muted/20 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Статус:</label>
                    <EditableStatus
                      value={manhwa.status}
                      manhwaId={id}
                      token={token}
                      onUpdate={(value) => handleUpdate('status', value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Тип публікації:</label>
                    <select
                      value={manhwa.publication_type || 'uncensored'}
                      onChange={(e) => {
                        setManhwa(prev => prev ? { ...prev, publication_type: e.target.value as 'censored' | 'uncensored' } : null);
                        
                        if (token) {
                          fetch(`/api/admin/manhwa/${id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ publication_type: e.target.value }),
                          })
                            .then(res => res.ok ? res.json() : Promise.reject())
                            .then(() => invalidateManhwaCache(id))
                            .catch(() => setError('Помилка при оновленні'));
                        }
                      }}
                      className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded text-sm focus:outline-none focus:border-accent-gradient"
                    >
                      <option value="uncensored">🔞 Без цензури</option>
                      <option value="censored">🔒 Цензурована</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Тип:</label>
                    <select
                      value={manhwa.type || 'manhwa'}
                      onChange={(e) => {
                        setManhwa(prev => prev ? { ...prev, type: e.target.value as 'manhwa' | 'manga' | 'manhua' } : null);
                        
                        if (token) {
                          fetch(`/api/admin/manhwa/${id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ type: e.target.value }),
                          })
                            .then(res => res.ok ? res.json() : Promise.reject())
                            .then(() => invalidateManhwaCache(id))
                            .catch(() => setError('Помилка при оновленні'));
                        }
                      }}
                      className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded text-sm focus:outline-none focus:border-accent-gradient"
                    >
                      <option value="manhwa">🇰🇷 Манхва</option>
                      <option value="manga">🇯🇵 Манга</option>
                      <option value="manhua">🇨🇳 Маньхуа</option>
                    </select>
                  </div>
                </div>

                <div className="bg-card-bg/50 p-4 rounded-lg border border-text-muted/20">
                  <p className="text-sm text-text-muted mb-2">Теги:</p>
                  <EditableTags
                    value={manhwa.tags}
                    manhwaId={id}
                    token={token}
                    onUpdate={(value) => handleUpdate('tags', value)}
                  />
                </div>

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

            <div className="bg-card-bg border border-text-muted/20 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-main">📚 Розділи</h2>
                <button
                  onClick={() => {
                    setModal('create');
                    setCreateFormData({ title: '', description: '', vip_only: false, vip_early_days: 0 });
                  }}
                  className="px-4 py-2 relative bg-black text-white rounded-lg font-semibold overflow-hidden"
                  style={{
                    background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                    border: '2px solid transparent',
                  }}
                >
                  ➕ Завантажити розділ
                </button>
              </div>

              {chapters.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <p className="mb-4">Поки немає розділів</p>
                  <button
                    onClick={() => {
                      setModal('create');
                      setCreateFormData({ title: '', description: '', vip_only: false, vip_early_days: 0 });
                    }}
                    className="px-4 py-2 relative bg-black text-white rounded-lg font-semibold overflow-hidden"
                    style={{
                      background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                      border: '2px solid transparent',
                    }}
                  >
                    ➕ Завантажити розділ
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="group p-4 bg-bg-main border border-text-muted/20 rounded-lg hover:border-accent-gradient transition-all"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-text-main">
                              Розділ {chapter.chapter_number}
                            </h3>
                            {getStatusBadge(chapter.status)}
                            {chapter.vip_only && (
                              <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded border border-purple-500/30">
                                🔒 VIP Only
                              </span>
                            )}
                            {!chapter.vip_only && chapter.vip_early_days && chapter.vip_early_days > 0 && (
                              <span className="px-2 py-1 bg-indigo-600/20 text-indigo-400 text-xs rounded border border-indigo-500/30">
                                ⏰ VIP +{chapter.vip_early_days}д
                              </span>
                            )}
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
                              setPublishVipOnly(false);
                              setPublishVipEarlyDays(0);
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
      </div>

      {/* MODAL - CREATE CHAPTER */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card-bg rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-text-main mb-4">Створити розділ</h2>
            <form onSubmit={handleCreateChapter} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Назва:</label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                  className="w-full px-3 py-2 bg-bg-main text-text-main border border-text-muted/20 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Назва розділу"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Опис:</label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-bg-main text-text-main border border-text-muted/20 rounded focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                  placeholder="Опис розділу"
                />
              </div>

              {/* VIP Settings */}
              <div className="border-t border-text-muted/20 pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-text-main">⭐ VIP Налаштування</h3>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createFormData.vip_only}
                    onChange={(e) => setCreateFormData({...createFormData, vip_only: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-main">🔒 Тільки для VIP</span>
                    <p className="text-xs text-text-muted">Доступ лише VIP та адміністраторам</p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    ⏰ Ранній доступ для VIP (днів)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={createFormData.vip_early_days}
                    onChange={(e) => setCreateFormData({...createFormData, vip_early_days: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    VIP отримають доступ на {createFormData.vip_early_days} {createFormData.vip_early_days === 1 ? 'день' : 'днів'} раніше
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors disabled:opacity-50"
                >
                  ✅ Створити
                </button>
                <button
                  type="button"
                  onClick={() => setModal('none')}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition-colors"
                >
                  ❌ Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - UPLOAD PAGES */}
      {modal === 'upload' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card-bg rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-text-main mb-4">Завантажити сторінки</h2>
            <form onSubmit={handleUploadPages} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Розділ: {activeChapter?.chapter_number}</label>
              </div>
              <div className="border-2 border-dashed border-text-muted/50 rounded p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="hidden"
                  id="pages-input"
                />
                <label htmlFor="pages-input" className="cursor-pointer">
                  <div className="text-3xl mb-2">📁</div>
                  <p className="text-text-muted text-sm mb-1">Виберіть зображення</p>
                  <p className="text-text-muted text-xs">{uploadFiles.length} файлів обрано</p>
                  {uploadFiles.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Розмір: {(uploadFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(2)} МБ
                    </p>
                  )}
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading || uploadFiles.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors disabled:opacity-50"
                >
                  📤 Завантажити
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModal('none');
                    setUploadFiles([]);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition-colors"
                >
                  ❌ Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - PUBLISH */}
      {modal === 'publish' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card-bg rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-text-main mb-4">Опублікувати розділ</h2>
            <form onSubmit={handlePublishChapter} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Розділ: {activeChapter?.chapter_number}</label>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="now"
                    checked={publishMode === 'now'}
                    onChange={(e) => setPublishMode(e.target.value as 'now' | 'schedule')}
                    className="w-4 h-4"
                  />
                  <span className="text-text-main">Опублікувати зараз</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="schedule"
                    checked={publishMode === 'schedule'}
                    onChange={(e) => setPublishMode(e.target.value as 'now' | 'schedule')}
                    className="w-4 h-4"
                  />
                  <span className="text-text-main">Запланувати публікацію</span>
                </label>
              </div>
              
              {publishMode === 'schedule' && (
                <>
                  <div>
                    <label className="block text-sm text-text-muted mb-2">Дата:</label>
                    <input
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-2">Час:</label>
                    <input
                      type="time"
                      value={publishTime}
                      onChange={(e) => setPublishTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* VIP Settings */}
              <div className="border-t border-text-muted/20 pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-text-main">⭐ VIP Налаштування</h3>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishVipOnly}
                    onChange={(e) => {
                      setPublishVipOnly(e.target.checked);
                      if (e.target.checked) {
                        setPublishVipEarlyDays(0);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-main">🔒 Тільки для VIP</span>
                    <p className="text-xs text-text-muted">Доступ лише VIP та адміністраторам</p>
                  </div>
                </label>

                {!publishVipOnly && (
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">
                      ⏰ Ранній доступ для VIP (днів)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={publishVipEarlyDays}
                      onChange={(e) => setPublishVipEarlyDays(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded focus:outline-none focus:border-blue-500"
                      placeholder="0"
                    />
                    {publishMode === 'now' ? (
                      <p className="text-xs text-text-muted mt-1">
                        {publishVipEarlyDays === 0 ? (
                          '✅ Доступно всім одразу'
                        ) : (
                          <>
                            VIP отримають доступ <span className="text-green-400">зараз</span>, звичайні користувачі — через{' '}
                            <span className="text-yellow-400">{publishVipEarlyDays} {publishVipEarlyDays === 1 ? 'день' : publishVipEarlyDays < 5 ? 'дні' : 'днів'}</span>
                            {' '}({new Date(Date.now() + publishVipEarlyDays * 24 * 60 * 60 * 1000).toLocaleDateString('uk-UA')})
                          </>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-text-muted mt-1">
                        {publishVipEarlyDays === 0 ? (
                          '✅ Доступно всім в запланований час'
                        ) : publishDate ? (
                          <>
                            VIP отримають доступ{' '}
                            <span className="text-green-400">{new Date(`${publishDate}T${publishTime}`).toLocaleDateString('uk-UA')}</span>, 
                            звичайні — через {publishVipEarlyDays} {publishVipEarlyDays === 1 ? 'день' : 'днів'}{' '}
                            ({new Date(new Date(`${publishDate}T${publishTime}`).getTime() + publishVipEarlyDays * 24 * 60 * 60 * 1000).toLocaleDateString('uk-UA')})
                          </>
                        ) : (
                          `VIP отримають доступ на ${publishVipEarlyDays} ${publishVipEarlyDays === 1 ? 'день' : 'днів'} раніше`
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-semibold transition-colors disabled:opacity-50"
                >
                  ⏰ Опублікувати
                </button>
                <button
                  type="button"
                  onClick={() => setModal('none')}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition-colors"
                >
                  ❌ Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}