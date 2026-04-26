'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/app/providers/UserProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/features/auth';

export default function UserMenu() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { profile, loading: profileLoading, isAdmin } = useUserProfile();
  const { signOut } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // ✅ КРИТИЧНО: Правильно обрабатываем loading
  if (authLoading || profileLoading) {
    return (
      <div className="w-10 h-10 md:w-20 md:h-6 bg-card-bg border border-text-muted/20 rounded-lg animate-pulse" />
    );
  }

  // ✅ Если нет user - показываем кнопку "Войти" с серой обводкой
  if (!user || !profile) {
    // Only log in development to avoid console spam
    if (process.env.NODE_ENV === 'development') {
    }
    return (
      <>
        {/* Мобильная кнопка с серой обводкой */}
        <Link
          href="/auth"
          className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all flex-shrink-0 border-2 border-text-muted/20 hover:border-text-muted/40"
          title="Увійти"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
        </Link>

        {/* Desktop кнопка с серой обводкой */}
        <Link
          href="/auth"
          className="hidden md:inline-flex md:-translate-y-[5px] px-6 py-2 text-white font-semibold rounded-lg transition-all items-center gap-2 flex-shrink-0 border-2 border-text-muted/20 hover:border-text-muted/40"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          Увійти
        </Link>
      </>
    );
  }

  // Show UserMenu for logged in users
  const username = profile.username || profile.email?.split('@')[0] || 'User';

  const handleSignOut = async () => {
    startTransition(async () => {
      try {
        
        await signOut();
        
        setOpen(false);
        
        // router.refresh() updates server components
        setTimeout(() => {
          router.refresh();
          router.push('/');
        }, 300);
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Неочікувана помилка');
      }
    });
  };

  return (
    <div className="relative flex-shrink-0">
      {/* Мобильная кнопка - иконка человечка с градиентом */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all flex-shrink-0"
        style={{
          background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
          border: '2px solid transparent'
        }}
        title={username}
        disabled={isPending}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 27, 109, 0.5), 0 0 10px rgba(162, 89, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </button>

      {/* Desktop кнопка с градиентом */}
      <button
        onClick={() => setOpen(!open)}
        className="hidden md:inline-flex md:-translate-y-[5px] items-center gap-2 px-3 py-2 text-white font-medium rounded-lg transition-all flex-shrink-0 disabled:opacity-50"
        style={{
          background: 'linear-gradient(#000000, #000000) padding-box, linear-gradient(135deg, #FF1B6D, #A259FF) border-box',
          border: '2px solid transparent'
        }}
        disabled={isPending}
        onMouseEnter={(e) => {
          if (!isPending) {
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 27, 109, 0.5), 0 0 15px rgba(162, 89, 255, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="text-sm max-w-[100px] truncate">
          {username}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card-bg border border-text-muted/20 rounded-lg shadow-xl overflow-hidden z-50 max-md:w-[180px] max-md:max-w-[calc(100vw-40px)]">
          <div className="px-4 py-3 border-b border-text-muted/10 bg-card-hover/50">
            <p className="text-text-main font-semibold">{username}</p>
            <p className="text-text-muted text-xs">{profile.username || profile.email?.split('@')[0]}</p>
            {isAdmin && (
              <p className="text-blue-400 text-xs mt-1">👑 Адміністратор</p>
            )}
          </div>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-3 text-text-main hover:bg-card-hover transition-colors text-sm"
          >
            Профіль
          </Link>

          <Link
            href="/profile/library"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-3 text-text-main hover:bg-card-hover transition-colors text-sm"
          >
            Обрані
          </Link>

          <Link
            href="/profile/reading-history"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-3 text-text-main hover:bg-card-hover transition-colors text-sm"
          >
            Історія читання
          </Link>

          {isAdmin && (
            <>
              <div className="border-t border-text-muted/10" />
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block w-full text-left px-4 py-3 text-blue-400 hover:bg-blue-600/20 transition-colors text-sm"
              >
                Адмін-панель
              </Link>
            </>
          )}

          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm border-t border-text-muted/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Вихід...' : 'Вийти'}
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}