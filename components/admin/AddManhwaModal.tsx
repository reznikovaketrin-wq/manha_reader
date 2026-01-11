'use client';

import { useState } from 'react';

interface AddManhwaModalProps {
  token: string;
  onManhwaCreated: (manhwa: any) => void;
  onClose: () => void;
}

export function AddManhwaModal({ token, onManhwaCreated, onClose }: AddManhwaModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    short_description: '',
    status: 'ongoing',
    tags: '',
    vip_only: false,
    vip_early_days: 0,
  });

  const [images, setImages] = useState<Record<string, { file: File | null; preview: string | null }>>({
    cover: { file: null, preview: null },
    bg: { file: null, preview: null },
    char: { file: null, preview: null },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value,
    }));
  };

  const handleImageSelect = (type: 'cover' | 'bg' | 'char', file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImages((prev) => ({
        ...prev,
        [type]: {
          file,
          preview: e.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('➕ [AddManhwaModal] Creating manhwa...');
      setLoading(true);
      setError(null);

      const uploadedImages: Record<string, string> = {};

      for (const [key, imageData] of Object.entries(images)) {
        if (imageData.file) {
          console.log(`📤 Uploading ${key}...`);
          setProgress(Math.round((Object.keys(uploadedImages).length / 3) * 100));

          const imgFormData = new FormData();
          imgFormData.append('file', imageData.file);
          imgFormData.append('type', key);
          imgFormData.append('manhwaId', formData.id);

          const uploadResponse = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: imgFormData,
          });

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || 'Upload failed');
          }

          const uploadData = await uploadResponse.json();
          uploadedImages[`${key}_image`] = uploadData.url;
          console.log(`✅ ${key} uploaded`);
        }
      }

      setProgress(75);

      const response = await fetch('/api/admin/manhwa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: formData.id,
          title: formData.title,
          description: formData.description,
          short_description: formData.short_description,
          status: formData.status,
          rating: 0,
          tags: formData.tags.split(',').map((tag) => tag.trim()),
          vip_only: formData.vip_only,
          vip_early_days: formData.vip_early_days,
          ...uploadedImages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Creation failed');
      }

      const data = await response.json();
      console.log('✅ Manhwa created:', data.data.id);

      setProgress(100);
      setTimeout(() => {
        setProgress(0);
        onManhwaCreated(data.data);
      }, 1000);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Error creating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg border border-text-muted/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Шапка модалки */}
        <div className="sticky top-0 bg-card-bg border-b border-text-muted/20 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-main">➕ Нова манхва</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ID */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">ID (унікальний)</label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleInputChange}
              placeholder="lycar-ta-vidma"
              className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-xl text-text-main focus:outline-none focus:border-[#ff1b6d]"
              required
            />
          </div>

          {/* Назва */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">Назва</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Лицар та Відьма"
              className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-xl text-text-main focus:outline-none focus:border-[#ff1b6d]"
              required
            />
          </div>

          {/* Опис */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">Опис</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-xl text-text-main focus:outline-none focus:border-[#ff1b6d] resize-none"
            />
          </div>

          {/* Короткий опис */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">Короткий опис</label>
            <textarea
              name="short_description"
              value={formData.short_description}
              onChange={handleInputChange}
              placeholder="Коротке описання для карточки (макс 150 символів)"
              rows={2}
              maxLength={150}
              className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-xl text-text-main focus:outline-none focus:border-[#ff1b6d] resize-none"
            />
            <p className="text-xs text-text-muted mt-1">
              {formData.short_description.length}/150
            </p>
          </div>

          {/* Статус */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">Статус</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-xl text-text-main focus:outline-none focus:border-[#ff1b6d]"
            >
              <option value="ongoing">Онгоїнг</option>
              <option value="completed">Завершена</option>
              <option value="hiatus">Ваншот</option>
            </select>
          </div>

          {/* Теги */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">Теги (через кому)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="БЕЗ ЦЕНЗУРИ, МАНХВА"
              className="w-full px-3 py-2 bg-white text-black border border-text-muted/20 rounded focus:outline-none focus:border-accent-gradient"
            />
          </div>

          {/* VIP Settings */}
          <div className="border-t border-text-muted/20 pt-4">
            <h3 className="text-lg font-semibold text-text-main mb-3">⭐ VIP Налаштування</h3>
            
            {/* VIP Only */}
            <div className="mb-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="vip_only"
                  checked={formData.vip_only}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#ff1b6d] bg-gray-100 border-gray-300 rounded focus:ring-[#ff1b6d]"
                />
                <div>
                  <span className="text-sm font-medium text-text-main">🔒 Тільки для VIP</span>
                  <p className="text-xs text-text-muted">Контент доступний лише VIP та адміністраторам</p>
                </div>
              </label>
            </div>

            {/* VIP Early Access */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                ⏰ Ранній доступ для VIP (днів)
              </label>
              <input
                type="number"
                name="vip_early_days"
                min="0"
                max="30"
                value={formData.vip_early_days}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-xl text-text-main focus:outline-none focus:border-[#ff1b6d]"
                placeholder="0"
              />
              <p className="text-xs text-text-muted mt-1">
                VIP користувачі отримають доступ на {formData.vip_early_days} {formData.vip_early_days === 1 ? 'день' : 'днів'} раніше
              </p>
            </div>
          </div>

          {/* Изображения */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-3">Изображения</label>
            <div className="grid grid-cols-3 gap-3">
              {(['cover', 'bg', 'char'] as const).map((type) => (
                <div key={type}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(type, e.target.files?.[0] || null)}
                    className="hidden"
                    id={`img-${type}`}
                  />
                  <label
                    htmlFor={`img-${type}`}
                    className={`block p-3 border-2 border-dashed rounded text-center cursor-pointer transition-colors ${
                      images[type].preview
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-text-muted/50 hover:border-text-muted/80'
                    }`}
                  >
                    {images[type].preview ? (
                      <div>
                        <img
                          src={images[type].preview!}
                          alt={type}
                          className="w-full h-16 object-cover rounded mb-1"
                        />
                        <span className="text-xs text-green-400">✅ Готово</span>
                      </div>
                    ) : (
                      <div className="text-sm text-text-muted">
                        {type === 'cover' ? '🖼️ Обложка' : type === 'bg' ? '🌅 Фон' : '👤 Персонаж'}
                      </div>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Прогресс */}
          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-main">Завантаження...</span>
                <span className="text-text-muted">{progress}%</span>
              </div>
              <div className="w-full bg-text-muted/20 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="p-3 bg-red-500/20 text-red-400 rounded text-sm">{error}</div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 relative bg-black text-white font-semibold rounded-xl transition-all overflow-hidden disabled:opacity-50"
              style={{
                background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                border: '2px solid transparent',
              }}
            >
              {loading ? '⏳ Створення...' : '➕ Створити'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-3 bg-transparent text-white font-semibold rounded-xl border-2 border-white/10 hover:border-white/20 transition-all"
            >
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}