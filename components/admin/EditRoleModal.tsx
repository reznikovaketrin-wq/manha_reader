'use client';

import { useState } from 'react';
import { UserRole, RoleDurationType } from '@/types/role';

interface EditRoleModalProps {
  userId: string;
  userEmail: string;
  currentRole: UserRole;
  onClose: () => void;
  onUpdate: (role: UserRole, durationType: RoleDurationType, customDays?: number) => Promise<void>;
}

export function EditRoleModal({ 
  userId, 
  userEmail, 
  currentRole, 
  onClose, 
  onUpdate 
}: EditRoleModalProps) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [durationType, setDurationType] = useState<RoleDurationType>('permanent');
  const [customDays, setCustomDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onUpdate(role, durationType, durationType === 'custom_days' ? customDays : undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка оновлення ролі');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card-bg border border-text-muted/20 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-text-muted/20 flex justify-between items-center bg-bg-main/50">
          <div>
            <h2 className="text-xl font-bold text-text-main">Керування роллю</h2>
            <p className="text-sm text-text-muted">{userEmail}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-muted uppercase tracking-wider">Оберіть роль</label>
            <div className="grid grid-cols-3 gap-3">
              {(['user', 'vip', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all ${
                    role === r 
                      ? 'border-[#ff1b6d] text-[#ff1b6d] bg-[#ff1b6d]/10' 
                      : 'border-white/10 bg-black text-text-muted hover:border-white/20'
                  }`}
                >
                  {r === 'admin' && '👑 '}
                  {r === 'vip' && '⭐ '}
                  {r === 'user' && '👤 '}
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-muted uppercase tracking-wider">Тривалість</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setDurationType('permanent')}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  durationType === 'permanent'
                    ? 'border-[#ff1b6d] text-[#ff1b6d] bg-[#ff1b6d]/10'
                    : 'border-white/10 bg-black text-text-muted hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">∞</span>
                  <span className="font-medium">Назавжди</span>
                </div>
                {durationType === 'permanent' && <div className="w-2 h-2 rounded-full bg-[#ff1b6d]" />}
              </button>

              <button
                type="button"
                onClick={() => setDurationType('month')}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  durationType === 'month'
                    ? 'border-[#ff1b6d] text-[#ff1b6d] bg-[#ff1b6d]/10'
                    : 'border-white/10 bg-black text-text-muted hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <span className="font-medium">На місяць (30 днів)</span>
                </div>
                {durationType === 'month' && <div className="w-2 h-2 rounded-full bg-[#ff1b6d]" />}
              </button>

              <button
                type="button"
                onClick={() => setDurationType('custom_days')}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  durationType === 'custom_days'
                    ? 'border-[#ff1b6d] text-[#ff1b6d] bg-[#ff1b6d]/10'
                    : 'border-white/10 bg-black text-text-muted hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔢</span>
                  <span className="font-medium">Вказати дні</span>
                </div>
                {durationType === 'custom_days' && <div className="w-2 h-2 rounded-full bg-[#ff1b6d]" />}
              </button>
            </div>
          </div>

          {/* Custom Days Input */}
          {durationType === 'custom_days' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <input
                type="number"
                min="1"
                max="3650"
                value={customDays}
                onChange={(e) => setCustomDays(parseInt(e.target.value))}
                className="w-full bg-bg-main border border-text-muted/20 rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent-gradient"
                placeholder="Кількість днів..."
              />
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-transparent border-2 border-white/10 hover:border-white/20 text-white font-bold rounded-xl transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 px-6 relative bg-black/90 text-white font-bold rounded-xl border border-transparent bg-clip-padding transition-all flex items-center justify-center gap-2 overflow-hidden after:content-[''] after:absolute after:inset-0 after:-z-10 after:rounded-xl after:bg-gradient-to-br after:from-[#FF1B6D] after:to-[#A259FF] after:p-[2px] hover:shadow-[0_0_20px_rgba(255,27,109,0.3)] hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                border: '2px solid transparent',
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Зберегти зміни'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
