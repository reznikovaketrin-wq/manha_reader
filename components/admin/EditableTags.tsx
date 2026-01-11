'use client';

import { useState } from 'react';

interface EditableTagsProps {
  value: string[];
  manhwaId: string;
  token: string;
  onUpdate: (value: string[]) => void;
}

export function EditableTags({ value, manhwaId, token, onUpdate }: EditableTagsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.join(', '));
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);

      const tags = editValue
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await fetch(`/api/admin/manhwa/${manhwaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tags }),
      });

      if (!response.ok) throw new Error('Save failed');

      const data = await response.json();
      onUpdate(data.data.tags);
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Помилка при збереженні');
      setEditValue(value.join(', '));
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
          placeholder="МАНХВА, БЕЗ ЦЕНЗУРИ, ДРАМА"
          className="w-full bg-black border-2 border-white/10 text-text-main rounded-xl px-4 py-3 focus:outline-none resize-none"
          rows={3}
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
              setEditValue(value.join(', '));
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
        <div className="flex flex-wrap gap-2">
          {value.length > 0 ? (
            value.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-white/5 text-text-main rounded-full text-sm">
                {tag}
              </span>
            ))
          ) : (
            <p className="text-text-muted text-sm">Теги не додані</p>
          )}
        </div>
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