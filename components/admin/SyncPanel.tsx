"use client";

import { useState } from "react";
import { getAccessToken } from "@/lib/auth";

interface SyncModalProps {
  token?: string | null;
  onClose: () => void;
}

export function SyncModal({ token: initialToken, onClose }: SyncModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const runSync = async () => {
    try {
      setResult(null);
      setLoading(true);

      let token = initialToken || (await getAccessToken());
      if (!token) throw new Error("Not authorized");

      const res = await fetch('/api/admin/sync-r2', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      setResult(json.success ? json : { success: false, error: json.error || 'Sync failed' });
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg border border-text-muted/20 rounded-xl w-full max-w-2xl">
        <div className="p-6 border-b border-text-muted/20 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-main">🔄 Синхронізація R2 → БД</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {!loading && !result && (
            <div className="space-y-4">
              <p className="text-text-muted">
                Синхронізувати дані з R2 Storage в базу даних. Це створить розділи та сторінки для всіх манхв у R2.
              </p>
              <button
                onClick={runSync}
                className="w-full px-4 py-3 relative bg-black text-white font-semibold rounded-xl transition-all overflow-hidden"
                style={{
                  background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                  border: '2px solid transparent',
                }}
              >
                ▶️ Запустити синхронізацію
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mb-4"></div>
              <p className="text-text-main font-semibold">Синхронізація...</p>
              <p className="text-text-muted text-sm mt-2">Це може зайняти деякий час</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.success ? (
                <>
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 font-semibold">✅ Синхронізація завершена</p>
                  </div>
                  
                  {result.results && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-bg-main rounded">
                        <p className="text-text-muted">Манхв оброблено</p>
                        <p className="text-text-main font-bold text-xl">{result.results.manhwasProcessed}</p>
                      </div>
                      <div className="p-3 bg-bg-main rounded">
                        <p className="text-text-muted">Розділів створено</p>
                        <p className="text-text-main font-bold text-xl">{result.results.chaptersCreated}</p>
                      </div>
                      <div className="p-3 bg-bg-main rounded">
                        <p className="text-text-muted">Сторінок створено</p>
                        <p className="text-text-main font-bold text-xl">{result.results.pagesCreated}</p>
                      </div>
                      <div className="p-3 bg-bg-main rounded">
                        <p className="text-text-muted">Зображень оновлено</p>
                        <p className="text-text-main font-bold text-xl">{result.results.imagesUpdated}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setResult(null);
                      onClose();
                    }}
                    className="w-full px-4 py-3 bg-transparent text-white font-semibold rounded-xl border-2 border-white/10 hover:border-white/20 transition-all"
                  >
                    Закрити
                  </button>
                </>
              ) : (
                <>
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 font-semibold">❌ Помилка синхронізації</p>
                    <p className="text-red-300 text-sm mt-2">{result.error}</p>
                  </div>
                  <button
                    onClick={() => setResult(null)}
                    className="w-full px-4 py-3 relative bg-black text-white font-semibold rounded-xl transition-all overflow-hidden"
                    style={{
                      background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                      border: '2px solid transparent',
                    }}
                  >
                    Спробувати ще раз
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SyncModal;
