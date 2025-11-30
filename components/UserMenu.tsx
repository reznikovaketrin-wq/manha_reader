'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
  };
}

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        setUser(authUser as User);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user as User);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [mounted]);

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      setUser(null);
      setOpen(false);
      router.push('/');
    }
  };

  if (!mounted || loading) {
    return (
      <div className="w-10 h-10 md:w-20 md:h-6 bg-card-bg border border-text-muted/20 rounded-lg animate-pulse" />
    );
  }

  // Не залогинен
  if (!user) {
    return (
      <>
        {/* 📱 Мобилка - иконка */}
        <Link
          href="/auth"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 p-2 hover:bg-card-hover border border-text-muted/20 rounded-lg transition-colors flex-shrink-0"
          title="Увійти"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
        </Link>

        {/* 💻 Десктоп - кнопка с текстом */}
        <Link
          href="/auth"
          className="hidden md:inline-flex px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors items-center gap-2 flex-shrink-0"
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

  const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';

  return (
    <div className="relative flex-shrink-0">
      {/* 📱 Мобилка - аватар */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex-shrink-0"
        title={username}
      >
        {username[0].toUpperCase()}
      </button>

      {/* 💻 Десктоп - полное меню */}
      <button
        onClick={() => setOpen(!open)}
        className="hidden md:inline-flex items-center gap-2 px-3 py-2 bg-card-bg hover:bg-card-hover border border-text-muted/20 rounded-lg transition-colors flex-shrink-0"
      >
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {username[0].toUpperCase()}
        </div>
        <span className="text-text-main text-sm font-medium max-w-[100px] truncate">
          {username}
        </span>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card-bg border border-text-muted/20 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-text-muted/10 bg-card-hover/50">
            <p className="text-text-main font-semibold">{username}</p>
            <p className="text-text-muted text-xs">{user.email}</p>
          </div>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-3 text-text-main hover:bg-card-hover transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Профіль
          </Link>

          <Link
            href="/profile/reading-history"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-3 text-text-main hover:bg-card-hover transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.001c0 5.591 3.824 10.29 9 11.622m0-13c5.5 0 10-4.745 10-10.999C22 4.758 17.5 0 12 0m0 13v13m0-13C6.5 30.253 2 25.498 2 19.001c0 5.591 3.824 10.29 9 11.622m0-13c5.5 0 10 4.745 10 10.999C22 25.242 17.5 30 12 30"
              />
            </svg>
            Історія читання
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm border-t border-text-muted/10 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Вийти
          </button>
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}