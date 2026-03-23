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

  const statusesMap: Record<string, { label: string; emoji: string; color: string }> = {
    ongoing: { label: 'ОНҐОЇНҐ', emoji: '🔄', color: 'bg-blue-500/20 text-blue-400' },
    completed: { label: 'ЗАВЕРШЕНО', emoji: '✅', color: 'bg-green-500/20 text-green-400' },
    hiatus: { label: 'ПРИЗУПИНЕНО', emoji: '⏸️', color: 'bg-orange-500/20 text-orange-400' },
    paused: { label: 'НА ПАУЗІ', emoji: '⏹️', color: 'bg-yellow-500/20 text-yellow-400' },
    'one-shot': { label: 'ВАНШОТ', emoji: '📖', color: 'bg-purple-500/20 text-purple-400' },
  };

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

  const currentStatus = statusesMap[value] || statusesMap.ongoing;

  return (
    <div className="group">
      {isEditing ? (
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-4 py-3 bg-black border-2 border-white/10 text-text-main rounded-xl focus:outline-none focus:border-[#ff1b6d]"
          autoFocus
        >
          <option value="ongoing">ОНҐОЇНҐ</option>
          <option value="completed">ЗАВЕРШЕНО</option>
          <option value="hiatus">ПРИЗУПИНЕНО</option>
          <option value="paused">НА ПАУЗІ</option>
          <option value="one-shot">ВАНШОТ</option>
        </select>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${currentStatus.color}`}
          style={{ border: '2px solid rgba(255,255,255,0.06)' }}
        >
          {currentStatus.label}
        </button>
      )}
    </div>
  );
}