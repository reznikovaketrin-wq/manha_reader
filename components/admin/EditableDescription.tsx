'use client';

import { useState } from 'react';

interface EditableDescriptionProps {
  value: string;
  manhwaId: string;
  token: string;
  fieldName?: 'description' | 'short_description'; // 🆕 Параметр для имени поля
  onUpdate: (value: string) => void;
}

export function EditableDescription({
  value,
  manhwaId,
  token,
  fieldName = 'description', // По умолчанию 'description'
  onUpdate,
}: EditableDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);

      // 🎯 Динамически выбираем поле
      const payload = {
        [fieldName]: editValue,
      };

      const response = await fetch(`/api/admin/manhwa/${manhwaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Save failed');

      const data = await response.json();
      onUpdate(data.data[fieldName] || editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Помилка при збереженні');
      setEditValue(value);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full bg-black border-2 border-white/10 text-text-main rounded-xl px-4 py-3 focus:outline-none resize-none"
          rows={6}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-3 relative bg-black text-white font-semibold rounded-xl transition-all overflow-hidden"
            style={{
              background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
              border: '2px solid transparent',
            }}
          >
            ✅ Зберегти
          </button>
          <button
            onClick={() => {
              setEditValue(value);
              setIsEditing(false);
            }}
            className="px-4 py-3 bg-transparent text-white font-semibold rounded-xl border-2 border-white/10 hover:border-white/20 transition-all"
          >
            ❌ Скасувати
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex items-start justify-between gap-4 mb-2">
        <p className="text-text-main leading-relaxed">{value}</p>
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 relative bg-black text-white rounded text-sm whitespace-nowrap overflow-hidden"
          style={{
            background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
            border: '2px solid transparent',
          }}
        >
          🖊️
        </button>
      </div>
    </div>
  );
}