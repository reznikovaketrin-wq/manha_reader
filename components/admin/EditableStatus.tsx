'use client';

import { useState } from 'react';

interface EditableStatusProps {
  value: string;
  manhwaId: string;
  token: string;
  onUpdate: (value: string) => void;
}

export function EditableStatus({ value, manhwaId, token, onUpdate }: EditableStatusProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = async (newValue: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/manhwa/${manhwaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newValue }),
      });

      if (!response.ok) throw new Error('Save failed');

      const data = await response.json();
      onUpdate(data.data.status);
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Помилка при збереженні');
    } finally {
      setLoading(false);
    }
  };

  const statusLabel =
    value === 'ongoing'
      ? '🔴 Розкладі'
      : value === 'completed'
      ? '🟢 Завершено'
      : '🟡 Пауза';

  const statusColor =
    value === 'ongoing'
      ? 'bg-blue-500/20 text-blue-400'
      : value === 'completed'
      ? 'bg-green-500/20 text-green-400'
      : 'bg-yellow-500/20 text-yellow-400';

  return (
    <div className="group">
      {isEditing ? (
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="px-3 py-2 bg-white text-black rounded-lg border border-blue-500"
          autoFocus
        >
          <option value="ongoing">🔴 ongoing</option>
          <option value="completed">🟢 completed</option>
          <option value="hiatus">🟡 hiatus</option>
        </select>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-opacity group-hover:opacity-80 ${statusColor}`}
        >
          {statusLabel}
        </button>
      )}
    </div>
  );
}