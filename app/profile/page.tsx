 'use client';

import { useEffect, useState, useRef } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import buttonStyles from '../../components/ManhwaPage/ReadButton.module.css';
import { useAuth, useUpdateUsername, useUpdateAvatar } from '@/features/auth';
import { ProtectedRoute } from '@/shared/components';
import { supabase, getUserReadingStats } from '@/lib/supabase-client';

interface ReadingStats {
  totalManhwa: number;
  totalChapters: number;
  totalTimeSpent: number;
}

function ProfileContent() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [stats, setStats] = useState<ReadingStats>({
    totalManhwa: 0,
    totalChapters: 0,
    totalTimeSpent: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');
  
  // Username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const { 
    username: newUsername, 
    setUsername: setNewUsername, 
    error: usernameError, 
    success: usernameSuccess,
    isSubmitting: isUpdatingUsername,
    handleSubmit: submitUsername 
  } = useUpdateUsername();
  
  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, error: avatarError, uploadAvatar } = useUpdateAvatar();

  // ✅ Загружаємо статистику
  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        const statsRow: any = await getUserReadingStats(user.id, 5);
        setStats({
          totalManhwa: statsRow.total_manhwa || 0,
          totalChapters: statsRow.total_chapters || 0,
          totalTimeSpent: statsRow.estimated_minutes || 0,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
        setError('Помилка при завантаженні статистики');
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [user]);

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result: any = await uploadAvatar(file);
    if (result?.success) {
      // Avatar updated successfully
    }
  };

  // Handle username update
  const handleUsernameSubmit = async () => {
    await submitUsername();
    if (!usernameError) {
      setIsEditingUsername(false);
    }
  };

  // ✅ LOGOUT - БЕЗ ручного setUser!
  const handleLogout = async () => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔐 [Profile] Signing out...');
      }

      const result: any = await signOut();

      if (result?.success) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ [Profile] Sign out successful');
          console.log('🔔 [Profile] UserProvider will sync automatically via onAuthStateChange');
        }
        
        // ❌ УБРАЛИ: setUser(null);
        // ✅ UserProvider сам обновит через onAuthStateChange!
        
        setTimeout(() => {
          router.push('/');
        }, 300);
      } else {
        alert('Помилка при виході. Спробуйте ще раз.');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Неочікувана помилка');
    }
  };

    if (isLoading || loadingStats || profileLoading) {
    return (
      <div className="min-h-screen bg-page-bg text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Завантаження профілю...</p>
        </div>
      </div>
    );
  }

    if (error || !user) {
    return (
      <div className="min-h-screen bg-page-bg text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Помилка завантаження профілю'}</p>
          <Link href="/" className="text-blue-500 hover:text-blue-400">
            Повернутися на головну
          </Link>
        </div>
      </div>
    );
  }

  const userMetadata = (user as any)?.user_metadata;
  const fullName = profile?.username || userMetadata?.username || user.email?.split('@')[0] || 'User';

  function formatMinutes(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  return (
    <div className="min-h-screen bg-page-bg text-white">
      {/* Header (non-sticky, no back link) */}
      <header className="bg-transparent backdrop-blur-sm border-b border-text-muted/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center">
          <h1 className="text-2xl font-bold">Мій Профіль</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* User Header - Avatar & Name */}
        <div className="text-center mb-10">
          <div className="flex-shrink-0 inline-block mb-6">
            <div 
              className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative group overflow-hidden mx-auto"
              onClick={() => avatarInputRef.current?.click()}
            >
              {((profile as any)?.avatar_url || userMetadata?.avatar_url) ? (
                <img 
                  src={(profile as any)?.avatar_url || userMetadata?.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold">{fullName[0].toUpperCase()}</span>
              )}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">{isUploading ? 'Завантаження...' : 'Змінити фото'}</span>
                </div>
              </div>
            </div>
            <input 
              ref={avatarInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange}
              className="hidden"
            />
            {avatarError && <p className="text-red-500 text-xs mt-2">{avatarError}</p>}
          </div>
          
          <h2 className="text-4xl font-bold mb-2">{fullName}</h2>
          <p className="text-gray-400 text-lg mb-2">{profile?.username || user.email?.split('@')[0]}</p>
          <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
        </div>

        {/* Statistics Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Статистика читання</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Manhwa */}
            <div className="bg-black/60 rounded-xl border border-[rgba(162,89,255,0.2)] p-8 text-center hover:border-[rgba(162,89,255,0.4)] transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                {stats.totalManhwa}
              </div>
              <div className="text-white font-semibold mb-1">Прочитано манхви</div>
              <div className="text-gray-400 text-sm">Унікальних творів</div>
            </div>

            {/* Total Chapters */}
            <div className="bg-black/60 rounded-xl border border-[rgba(162,89,255,0.2)] p-8 text-center hover:border-[rgba(162,89,255,0.4)] transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">
                {stats.totalChapters}
              </div>
              <div className="text-white font-semibold mb-1">Прочитано розділів</div>
              <div className="text-gray-400 text-sm">Всього глав</div>
            </div>

            {/* Time Spent */}
            <div className="bg-black/60 rounded-xl border border-[rgba(162,89,255,0.2)] p-8 text-center hover:border-[rgba(162,89,255,0.4)] transition-all">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
                {formatMinutes(stats.totalTimeSpent)}
              </div>
              <div className="text-white font-semibold mb-1">Час у читанні</div>
              <div className="text-gray-400 text-sm">Години і хвилини</div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Швидкий доступ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reading History */}
            <Link href="/profile/reading-history">
              <div className="bg-black/60 rounded-xl border border-[rgba(255,255,255,0.08)] p-6 hover:border-[rgba(162,89,255,0.5)] hover:bg-black/80 transition-all cursor-pointer h-full group">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1 text-white">Історія читання</h3>
                    <p className="text-sm text-gray-400">Перегляньте всі прочитані манхви</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Library */}
            <Link href="/profile/library">
              <div className="bg-black/60 rounded-xl border border-[rgba(255,255,255,0.08)] p-6 hover:border-[rgba(162,89,255,0.5)] hover:bg-black/80 transition-all cursor-pointer h-full group">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-8.682a4.5 4.5 0 010-6.364z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1 text-white">Обрані</h3>
                    <p className="text-sm text-gray-400">Ваші обрані манхви</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Account Settings Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Параметри облікового запису</h3>
          <div className="bg-black/60 rounded-xl border border-[rgba(255,255,255,0.08)] p-8 max-w-2xl mx-auto">
          
            <div className="space-y-6">
              {/* Username */}
              <div className="pb-6 border-b border-[rgba(255,255,255,0.08)]">
                <p className="font-bold text-lg mb-3">Логін</p>
                {isEditingUsername ? (
                  <>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Нове ім'я користувача"
                        className="px-4 bg-black/60 border-2 border-[rgba(255,255,255,0.1)] rounded-lg text-white focus:border-purple-500 focus:outline-none w-full md:max-w-md h-12"
                        style={{ textTransform: 'none' }}
                        autoFocus
                      />
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleUsernameSubmit}
                          disabled={isUpdatingUsername}
                          className={`${buttonStyles.readButtonGradient} h-12 px-5 disabled:opacity-50 flex-shrink-0`}
                          style={{ width: 'auto', marginBottom: 0, borderRadius: 8 }}
                        >
                          {isUpdatingUsername ? 'Збереження...' : 'Зберегти'}
                        </button>
                        <button 
                          onClick={() => {
                            setIsEditingUsername(false);
                            setNewUsername('');
                          }}
                          className="h-12 px-5 bg-[rgba(255,255,255,0.02)] text-white font-medium rounded-lg transition-colors flex-shrink-0"
                          style={{ border: '2px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                        >
                          Скасувати
                        </button>
                      </div>
                    </div>
                    {usernameError && <p className="text-red-400 text-sm mt-2">{usernameError}</p>}
                    {usernameSuccess && <p className="text-green-400 text-sm mt-2">Логін успішно змінено!</p>}
                  </>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <p className="text-gray-400 mb-3 md:mb-0">{profile?.username || user.email?.split('@')[0]}</p>
                    <button 
                      onClick={() => setIsEditingUsername(true)}
                      className="h-12 px-6 bg-[rgba(255,255,255,0.02)] text-white font-medium rounded-lg transition-colors self-start md:self-auto"
                      style={{ border: '2px solid rgba(255,255,255,0.12)' }}
                    >
                      Змінити
                    </button>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <p className="font-bold text-lg mb-1">Пароль</p>
                  <p className="text-gray-400">Захистіть свій обліковий запис надійним паролем</p>
                </div>
                <Link
                  href="/profile/change-password"
                  className="px-6 py-2.5 bg-[rgba(255,255,255,0.02)] text-white font-medium rounded-lg transition-colors inline-block text-center"
                  style={{ border: '2px solid rgba(255,255,255,0.12)' }}
                >
                  Змінити пароль
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="text-center pb-8">
          <button
            onClick={handleLogout}
            className={`${buttonStyles.readButtonGradient} px-8 py-3 text-lg`}
          >
            Вийти з облікового запису
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}