'use client';

import { useState } from 'react';

interface EditableTitleProps {
  value: string;
  manhwaId: string;
  token: string;
  onUpdate: (value: string) => void;
}

export function EditableTitle({ value, manhwaId, token, onUpdate }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/manhwa/${manhwaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editValue }),
      });

      if (!response.ok) throw new Error('Save failed');

      const data = await response.json();
      onUpdate(data.data.title);
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
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full text-3xl font-bold bg-white text-black rounded px-3 py-2 border border-blue-500 focus:outline-none"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
          >
            ✅ Зберегти
          </button>
          <button
            onClick={() => {
              setEditValue(value);
              setIsEditing(false);
            }}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
          >
            ❌ Скасувати
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start justify-between gap-4">
      <h1 className="text-4xl font-bold text-text-main">{value}</h1>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
      >
        🖊️ Редагувати
      </button>
    </div>
  );
}