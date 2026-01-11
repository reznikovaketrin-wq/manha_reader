// app/admin/page.tsx
// Упрощённая админ-панель: вкладки для управления манхв и пользователями

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { AddManhwaModal } from "@/components/admin/AddManhwaModal";
import { UserManagement } from "@/components/admin/UserManagement";
import SyncModal from "@/components/admin/SyncPanel";

export const dynamic = "force-dynamic";

interface Manhwa {
  id: string;
  title: string;
  description?: string;
  status?: string;
  rating: number;
  cover_image?: string;
  tags?: string[];
  created_at?: string;
}

export default function AdminManhwaPage() {
  const router = useRouter();
  const [manhwas, setManhwas] = useState<Manhwa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"manhwa" | "users">("manhwa");

  useEffect(() => {
    loadManhwas();
  }, []);

  const loadManhwas = async () => {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      setToken(accessToken);

      const res = await fetch("/api/admin/manhwa", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load manhwas");
      const json = await res.json();
      setManhwas(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManhwaCreated = (m: Manhwa) => {
    setManhwas((s) => [m, ...s]);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gradient mx-auto mb-4" />
          <p className="text-text-muted">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              ⚙️ Адмін-панель
            </h1>
            <p className="text-text-muted mt-2 text-lg">Управління контентом та користувачами</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSyncModal(true)}
              className="px-6 py-3 bg-transparent border-2 border-white/10 hover:border-white/20 text-text-main rounded-xl font-medium flex items-center gap-2 transition-all"
            >
              🔄 <span className="hidden sm:inline">Sync R2</span>
            </button>

            <button
              onClick={async () => {
                if (!token) {
                  const accessToken = await getAccessToken();
                  setToken(accessToken);
                }
                setShowModal(true);
              }}
              className="px-6 py-3 relative bg-black text-white rounded-xl font-bold transition-all overflow-hidden flex items-center gap-2"
              style={{
                background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                border: '2px solid transparent',
              }}
            >
              <span>➕</span> <span className="hidden sm:inline">Додати манхву</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-bg-main/50 rounded-2xl border border-text-muted/10 w-fit">
          <button
            onClick={() => setActiveTab("manhwa")}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 relative overflow-hidden ${
              activeTab === "manhwa" 
                ? "text-white" 
                : "text-text-muted hover:text-text-main hover:bg-white/5"
            }`}
            style={activeTab === "manhwa" ? {
              background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
              border: '2px solid transparent',
            } : {}}
          >
            📚 Манхви
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 relative overflow-hidden ${
              activeTab === "users" 
                ? "text-white" 
                : "text-text-muted hover:text-text-main hover:bg-white/5"
            }`}
            style={activeTab === "users" ? {
              background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
              border: '2px solid transparent',
            } : {}}
          >
            👥 Користувачі
          </button>
        </div>

        <div className="bg-card-bg rounded-3xl border border-text-muted/10 p-6 min-h-[500px]">
          {activeTab === "manhwa" && (
            <>
              {manhwas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-text-muted">
                  <div className="w-24 h-24 bg-bg-main rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner border border-text-muted/10">📚</div>
                  <h3 className="text-xl font-bold text-text-main mb-2">Манхв поки немає</h3>
                  <p className="text-text-muted mb-6">Почніть з додавання першої манхви</p>
                  <button
                    onClick={async () => {
                      if (!token) {
                        const accessToken = await getAccessToken();
                        setToken(accessToken);
                      }
                      setShowModal(true);
                    }}
                    className="px-8 py-3 relative bg-black text-white rounded-xl font-semibold transition-all overflow-hidden"
                    style={{
                      background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
                      border: '2px solid transparent',
                    }}
                  >
                    Створити манхву
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {manhwas.map((manhwa) => (
                    <button
                      key={manhwa.id}
                      onClick={() => router.push(`/admin/manhwa/${manhwa.id}`)}
                      className="group flex flex-col gap-3 cursor-pointer text-left"
                    >
                      <div className="relative overflow-hidden rounded-2xl bg-bg-main aspect-[3/4] shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-accent-gradient/10 group-hover:-translate-y-1">
                        {manhwa.cover_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={manhwa.cover_image} alt={manhwa.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">📚</div>
                        )}

                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                          <span className="text-yellow-400 font-bold text-xs flex items-center gap-1">
                            ⭐ {manhwa.rating.toFixed(1)}
                          </span>
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <div>
                        <p className="font-bold text-text-main line-clamp-2 leading-tight transition-colors">
                          {manhwa.title}
                        </p>
                        {manhwa.status && (
                          <p className="text-xs text-text-muted mt-1 capitalize opacity-60">
                            {manhwa.status}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showModal && token && (
                <AddManhwaModal token={token} onManhwaCreated={handleManhwaCreated} onClose={() => setShowModal(false)} />
              )}
            </>
          )}

          {activeTab === "users" && token && <UserManagement token={token} />}

          {showSyncModal && <SyncModal token={token} onClose={() => setShowSyncModal(false)} />}
        </div>
      </div>
    </div>
  );
}