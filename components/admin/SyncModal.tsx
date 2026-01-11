"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";

interface SyncModalProps {
  token?: string | null;
  onClose: () => void;
}

export default function SyncModal({ token: initialToken, onClose }: SyncModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // don't auto-run; user triggers via button inside modal
  }, []);

  const runSync = async () => {
    try {
      setError(null);
      setResult(null);
      setLoading(true);

      const token = initialToken || (await getAccessToken());
      if (!token) throw new Error("Не авторизовано");

      const res = await fetch('/api/admin/sync-r2', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Sync failed');
        return;
      }

      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-card-bg border border-text-muted/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-card-bg border-b border-text-muted/20 p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">🔄 Синхронизация R2 → БД</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={runSync}
              disabled={loading}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50"
            >
              {loading ? 'Запуск...' : 'Запустить'}
            </button>
            <button onClick={onClose} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">Закрыть</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!result && !error && (
            <div className="text-sm text-text-muted">Нажмите «Запустить» для начала синхронизации.</div>
          )}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gradient" />
              <div>Идёт синхронизация, подождите...</div>
            </div>
          )}

          {result && (
            <div>
              <div className="p-4 bg-green-900/10 border border-green-500/30 rounded mb-3 text-sm text-green-300">✅ {result.message || 'Синхронизация завершена'}</div>

              <div className="p-4 bg-bg-main border border-text-muted/20 rounded space-y-2 text-sm">
                <div>📚 Манхв обработано: <strong>{result.results?.manhwasProcessed ?? 0}</strong></div>
                <div>📖 Розділів создано: <strong>{result.results?.chaptersCreated ?? 0}</strong></div>
                <div>📄 Сторінок создано: <strong>{result.results?.pagesCreated ?? 0}</strong></div>
                <div>🖼️ Изображений обновлено: <strong>{result.results?.imagesUpdated ?? 0}</strong></div>
                {result.results?.errors && result.results.errors.length > 0 && (
                  <div className="mt-2 text-sm text-red-300">
                    ❌ Ошибки:
                    <ul className="list-disc ml-5 mt-1">
                      {result.results.errors.map((e: string, i: number) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    // optional: reload page
                  }}
                  className="px-4 py-2 relative bg-black text-white rounded-xl font-semibold overflow-hidden"
                  style={{
                    background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                    border: '2px solid transparent',
                  }}
                >
                  Закрыть
                </button>

                <button
                  onClick={() => location.reload()}
                  className="px-4 py-2 bg-transparent text-white font-semibold rounded-xl border-2 border-white/10 hover:border-white/20 transition-all"
                >
                  Перезагрузить
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">❌ {error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
