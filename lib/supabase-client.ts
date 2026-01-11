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

/**
 * Track a view for a manhwa with optional deduplication.
 *
 * Logic:
 * - If `userId` is provided and a `views_logs` table exists, only count a view
 *   if the same user hasn't generated a view for this manhwa in the last `dedupeHours`.
 * - Falls back to simple increment of `views.view_count` if `views_logs` absent or on error.
 */
export async function trackManhwaView(
  manhwaId: string,
  chapterId?: string,
  userId?: string | undefined,
  dedupeHours: number = 24
) {
  try {
    const cutoff = new Date(Date.now() - dedupeHours * 3600 * 1000).toISOString();

    // Try server-side dedupe using a views_logs table (recommended).
    try {
      if (userId) {
        // Check if user has a recent log for this manhwa
        const { data: recent, error: recentErr } = await supabase
          .from('views_logs')
          .select('id, created_at')
          .eq('manhwa_id', manhwaId)
          .eq('user_id', userId)
          .gt('created_at', cutoff)
          .limit(1)
          .single();

        if (recentErr && recentErr.code !== 'PGRST116') throw recentErr;

        if (!recent) {
          // insert log and increment views
          const { error: insertErr } = await supabase.from('views_logs').insert({
            manhwa_id: manhwaId,
            chapter_id: chapterId || null,
            user_id: userId,
            created_at: new Date().toISOString(),
          });
          if (insertErr) throw insertErr;

          // increment views table (upsert)
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
            const { error } = await supabase.from('views').insert({
              manhwa_id: manhwaId,
              view_count: 1,
              last_viewed_at: new Date().toISOString(),
            });
            if (error) throw error;
          }
        }
        return { success: true };
      }
    } catch (err) {
      // If anything fails (e.g., views_logs table missing), fall back to simple increment below
      console.warn('views_logs dedupe failed, falling back to simple increment', err);
    }

    // Fallback: simple increment (no dedupe)
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

// ===== READ TRACKING (CHAPTER STATUS) =====

interface Range {
  s: number;
  e: number;
}

/**
 * Collapse array of chapter numbers into minimal ranges
 */
export function collapseToRanges(numbers: number[]): Range[] {
  if (numbers.length === 0) return [];
  
  const unique = Array.from(new Set(numbers)).sort((a, b) => a - b);
  const ranges: Range[] = [];
  let s = unique[0];
  let e = unique[0];
  
  for (let i = 1; i < unique.length; i++) {
    const n = unique[i];
    if (n <= e + 1) {
      e = Math.max(e, n);
    } else {
      ranges.push({ s, e });
      s = n;
      e = n;
    }
  }
  
  ranges.push({ s, e });
  return ranges;
}

/**
 * Merge and coalesce overlapping/adjacent ranges
 */
export function mergeRanges(existing: Range[], added: Range[]): Range[] {
  const all = [...existing, ...added];
  if (all.length === 0) return [];
  
  all.sort((a, b) => a.s - b.s);
  
  const result: Range[] = [];
  let cur = { ...all[0] };
  
  for (let i = 1; i < all.length; i++) {
    const r = all[i];
    if (r.s <= cur.e + 1) {
      cur.e = Math.max(cur.e, r.e);
    } else {
      result.push(cur);
      cur = { ...r };
    }
  }
  
  result.push(cur);
  return result;
}

/**
 * Check if a chapter number is within any range
 */
export function isInRanges(chapterNumber: number, ranges: Range[]): boolean {
  return ranges.some(r => chapterNumber >= r.s && chapterNumber <= r.e);
}

/**
 * Check if a chapter is read (combines read_chapters and archived_ranges)
 */
export function isChapterRead(
  chapterId: string | number,
  chapterNumber: number,
  readChapters: Set<string>,
  archivedRanges: Range[]
): boolean {
  // Normalize chapterId to string because DB stores chapter IDs as strings
  const idStr = String(chapterId);

  // First check recent read_chapters
  if (readChapters.has(idStr)) {
    return true;
  }

  // Then check archived ranges
  return isInRanges(chapterNumber, archivedRanges);
}

/**
 * Get reading progress for a user+manhwa (via RPC to bypass PostgREST cache)
 */
export async function getReadingProgress(userId: string, manhwaId: string) {
  try {
    // Use RPC instead of direct SELECT to bypass PostgREST schema cache
    const { data, error } = await supabase.rpc('get_reading_progress', {
      p_user_id: userId,
      p_manhwa_id: manhwaId
    });

    if (error) {
      console.error('[getReadingProgress] RPC error:', error);
      return null;
    }
    
    // RPC returns array, take first row
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching reading progress:', error);
    return null;
  }
}

/**
 * Add a read chapter to user's progress (atomic via RPC or client-side fallback)
 */
export async function upsertReadChapter(
  userId: string,
  manhwaId: string,
  chapterId: string,
  chapterNumber: number,
  cap: number = 200
) {
  try {
    // Try to use RPC function for atomic operation (chapterId must be TEXT, not array)
    console.log('[upsertReadChapter] RPC call params', { userId, manhwaId, chapterId, chapterNumber, cap });
    const { data, error } = await supabase.rpc('add_read_chapter', {
      uid: userId,
      mid: manhwaId,
      cid: chapterId, // Pass as TEXT, not array - RPC function handles conversion
      cnum: chapterNumber,
      cap: cap,
    });

    if (error) {
      console.warn('RPC add_read_chapter failed, using client-side fallback:', error);
      return await upsertReadChapterFallback(userId, manhwaId, chapterId, chapterNumber, cap);
    }

    console.log('[upsertReadChapter] RPC success', { userId, manhwaId, chapterId, chapterNumber });
    return { success: true, data };
  } catch (error) {
    console.error('Error in upsertReadChapter:', error);
    // Fallback to client-side implementation
    return await upsertReadChapterFallback(userId, manhwaId, chapterId, chapterNumber, cap);
  }
}

/**
 * Client-side fallback for upsertReadChapter (non-atomic, may have race conditions)
 */
async function upsertReadChapterFallback(
  userId: string,
  manhwaId: string,
  chapterId: string,
  chapterNumber: number,
  cap: number
) {
  try {
    // Get existing progress
    const existing = await getReadingProgress(userId, manhwaId);
    
    console.log('[upsertReadChapterFallback] existing progress', { userId, manhwaId, existing });

    let recent: string[] = (existing?.read_chapters as string[]) ?? [];
    let archived: Range[] = (existing?.archived_ranges as Range[]) ?? [];
    
    // Remove if already present (for recency)
    recent = recent.filter(id => id !== chapterId);
    
    // Add to end (most recent)
    recent.push(chapterId);
    
    // If exceeds cap, archive oldest
    let toArchiveNumbers: number[] = [];
    if (recent.length > cap) {
      const excess = recent.slice(0, recent.length - cap);
      recent = recent.slice(recent.length - cap);
      
      // For fallback, we only have the current chapterNumber
      // We can't easily map old IDs to numbers without additional data
      // So we skip archiving old items in fallback mode
      // Production should use RPC or pass all chapter data
    }
    
    // If we're archiving current chapter (shouldn't happen but for safety)
    if (toArchiveNumbers.length > 0) {
      const newRanges = collapseToRanges(toArchiveNumbers);
      archived = mergeRanges(archived, newRanges);
    }
    
    // Calculate count
    const archivedCount = archived.reduce((sum, r) => sum + (r.e - r.s + 1), 0);
    const totalCount = recent.length + archivedCount;
    
    console.log('[upsertReadChapterFallback] writing progress', {
      userId,
      manhwaId,
      chapterId,
      chapterNumber,
      recentLength: recent.length,
      archivedLength: archived.length,
      totalCount,
    });

    // Upsert
    const { error } = await supabase
      .from('reading_progress')
      .upsert({
        user_id: userId,
        manhwa_id: manhwaId,
        chapter_id: chapterId,
        page_number: 0,
        read_chapters: recent,
        archived_ranges: archived,
        read_count: totalCount,
        last_read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,manhwa_id' });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error in fallback upsertReadChapter:', error);
    return { success: false, error };
  }
}

/**
 * Sync guest's localStorage reading history to database on login
 */
export async function syncGuestReadingHistory(userId: string) {
  if (typeof window === 'undefined') return { success: false };
  
  try {
    const localKey = 'triw_reading_history';
    const stored = localStorage.getItem(localKey);
    
    if (!stored) return { success: true, synced: 0 };
    
    const history = JSON.parse(stored);
    const grouped: { [manhwaId: string]: Array<{ chapterId: string; chapterNumber?: number }> } = {};
    
    // Group by manhwa
    for (const item of history) {
      const { manhwaId, chapterId, chapterNumber } = item;
      if (!manhwaId || !chapterId) continue;
      
      if (!grouped[manhwaId]) grouped[manhwaId] = [];
      grouped[manhwaId].push({ chapterId, chapterNumber });
    }
    
    // Sync each manhwa's chapters
    let synced = 0;
    for (const [manhwaId, chapters] of Object.entries(grouped)) {
      // Take most recent chapters (up to cap)
      const recent = chapters.slice(-200);
      
      for (const { chapterId, chapterNumber } of recent) {
        if (chapterNumber) {
          await upsertReadChapter(userId, manhwaId, chapterId, chapterNumber);
          synced++;
        }
      }
    }
    
    // Clear localStorage after successful sync
    localStorage.removeItem(localKey);
    console.log(`[syncGuestReadingHistory] Synced ${synced} chapters from localStorage`);
    
    return { success: true, synced };
  } catch (error) {
    console.error('Error syncing guest reading history:', error);
    return { success: false, error };
  }
}

/**
 * Get aggregated reading stats for a user (uses DB RPC get_user_reading_stats)
 */
export async function getUserReadingStats(userId: string, minutesPerChapter: number = 5) {
  try {
    const { data, error } = await supabase.rpc('get_user_reading_stats', {
      p_user_id: userId,
      p_minutes_per_chapter: minutesPerChapter,
    });

    if (error) {
      console.error('[getUserReadingStats] RPC error:', error);
      return { total_manhwa: 0, total_chapters: 0, estimated_minutes: 0, last_read_at: null };
    }

    return (data && data.length > 0) ? data[0] : { total_manhwa: 0, total_chapters: 0, estimated_minutes: 0, last_read_at: null };
  } catch (err) {
    console.error('[getUserReadingStats] error:', err);
    return { total_manhwa: 0, total_chapters: 0, estimated_minutes: 0, last_read_at: null };
  }
}