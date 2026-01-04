// lib/supabase-client.ts
// ✅ ЕДИНСТВЕННЫЙ правильный Browser Supabase client - СИНГЛТОН

'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ ПРАВИЛЬНО: Singleton browser client с ПОЛНОЙ auth конфигурацией
// - createBrowserClient: работает с cookies в Next.js SSR
// - persistSession: сохраняет сессию в localStorage
// - autoRefreshToken: автоматически обновляет JWT
// - detectSessionInUrl: ловит сессию из URL (для callback после входа)
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// (debug exposure removed)

// ===== READING HISTORY =====

export async function saveReadingProgress(
  userId: string,
  manhwaId: string,
  chapterId: string,
  pageNumber: number
) {
  try {
    const { error } = await supabase
      .from('reading_history')
      .upsert(
        {
          user_id: userId,
          manhwa_id: manhwaId,
          chapter_id: chapterId,
          page_number: pageNumber,
          timestamp: new Date().toISOString(),
        },
        { onConflict: 'user_id,manhwa_id,chapter_id' }
      );

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving reading progress:', error);
    return { success: false, error };
  }
}

export async function getUserReadingHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reading history:', error);
    return [];
  }
}

export async function getLastReadChapter(userId: string, manhwaId: string) {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .eq('manhwa_id', manhwaId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching last read chapter:', error);
    return null;
  }
}

// ===== VIEWS =====

export async function trackManhwaView(manhwaId: string) {
  try {
    const { data: existingView } = await supabase
      .from('views')
      .select('view_count')
      .eq('manhwa_id', manhwaId)
      .single();

    if (existingView) {
      const { error } = await supabase
        .from('views')
        .update({
          view_count: existingView.view_count + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq('manhwa_id', manhwaId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('views')
        .insert({
          manhwa_id: manhwaId,
          view_count: 1,
          last_viewed_at: new Date().toISOString(),
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking view:', error);
    return { success: false, error };
  }
}

export async function getManhwaViewCount(manhwaId: string) {
  try {
    const { data, error } = await supabase
      .from('views')
      .select('view_count')
      .eq('manhwa_id', manhwaId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.view_count || 0;
  } catch (error) {
    console.error('Error fetching view count:', error);
    return 0;
  }
}

export async function getAllViewsStats() {
  try {
    const { data, error } = await supabase
      .from('views')
      .select('*')
      .order('view_count', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching views stats:', error);
    return [];
  }
}

// ===== USERS (DATA ONLY) =====

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  profile: { username?: string; [key: string]: any }
) {
  try {
    const { error } = await supabase
      .from('users')
      .update(profile)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error };
  }
}