import { supabase } from '@/lib/supabase-client';

// ============================================
// Types
// ============================================

export interface BaseComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_comment_id?: string | null;
}

export interface EnrichedComment extends BaseComment {
  user_email?: string;
  likes_count?: number;
  user_liked?: boolean;
  users?: { username?: string | null; email?: string | null } | null;
}

// Include related user info when loading comments
export interface CommentWithUser extends BaseComment {
  users?: { username?: string | null; email?: string | null } | null;
}

// ============================================
// Chapter Comments
// ============================================

export async function loadChapterComments(
  manhwaId: string,
  chapterId: string
): Promise<BaseComment[]> {
  try {
    const { data, error } = await supabase
      .from('chapter_comments')
      .select('id, user_id, content, created_at, updated_at, parent_comment_id, users(username,email)')
      .eq('manhwa_id', manhwaId)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Если связь users не настроена или возвращает null, вернём данные как есть —
    // вызывающий код уже умеет падать back к email/'Анонім'.
    // Однако, чтобы гарантировать наличие username, проверим и подгрузим пользователей при необходимости.
    const rows = (data || []) as any[];
    const needFallback = rows.some(r => !r.users || !r.users.username);
    if (!needFallback) return rows;

    // Подгружаем пользователей отдельно и мапим по user_id
    const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
    if (userIds.length === 0) return rows;

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, username, email')
      .in('id', userIds);

    // Если users table не содержит username, попробуем profiles
    let usersMap = new Map<string, { username?: string | null; email?: string | null }>();

    if (!usersError && usersData) {
      (usersData || []).forEach((u: any) => usersMap.set(u.id, { username: u.username, email: u.email }));
    }

    // Always try profiles if we have missing info or simply to supplement
    // Especially important because 'users' table often has strict RLS that hides other users
    if (usersMap.size < userIds.length) {
      try {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', userIds);
        
        (profilesData || []).forEach((u: any) => {
          const existing = usersMap.get(u.id);
          usersMap.set(u.id, { 
            username: u.username || existing?.username, 
            email: u.email || existing?.email 
          });
        });
      } catch (pe) {
        // ignore
      }
    }

    return rows.map(r => {
      const u = r.users;
      const m = usersMap.get(r.user_id);
      return { ...r, users: (u && u.username) ? u : (m || u || null) };
    });
  } catch (err) {
    // В крайнем случае — пробуем более простой селект без relation
    const { data, error } = await supabase
      .from('chapter_comments')
      .select('id, user_id, content, created_at, updated_at, parent_comment_id')
      .eq('manhwa_id', manhwaId)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const rows = (data || []) as any[];

    // Попробуем подгрузить пользователей для этих комментариев
    const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
    if (userIds.length > 0) {
      try {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, username, email')
          .in('id', userIds);

        let usersMap = new Map<string, { username?: string | null; email?: string | null }>();
        if (usersData) {
          (usersData || []).forEach((u: any) => usersMap.set(u.id, { username: u.username, email: u.email }));
        }

        if (usersMap.size < userIds.length) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, email')
            .in('id', userIds);
          
          (profilesData || []).forEach((u: any) => {
             const existing = usersMap.get(u.id);
             usersMap.set(u.id, { 
               username: u.username || existing?.username, 
               email: u.email || existing?.email 
             });
          });
        }

        return rows.map(r => ({ ...r, users: usersMap.get(r.user_id) || null }));
      } catch (uerr) {
        return rows;
      }
    }

    return rows;
  }
}

export async function createChapterComment(
  manhwaId: string,
  chapterId: string,
  userId: string,
  content: string,
  parentCommentId?: string | null
): Promise<BaseComment> {
  const { data, error } = await supabase
    .from('chapter_comments')
    .insert([
      {
        user_id: userId,
        manhwa_id: manhwaId,
        chapter_id: chapterId,
        content,
        parent_comment_id: parentCommentId || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// Manhwa Comments
// ============================================

export async function loadManhwaComments(
  manhwaId: string
): Promise<CommentWithUser[]> {
  try {
    const { data, error } = await supabase
      .from('manhwa_comments')
      .select('id, user_id, content, created_at, updated_at, parent_comment_id, display_name, users(username,email)')
      .eq('manhwa_id', manhwaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CommentWithUser[];
  } catch (err) {
    console.warn('Could not select related users for manhwa_comments, retrying without relation', err);
    const { data, error } = await supabase
      .from('manhwa_comments')
      .select('id, user_id, content, created_at, updated_at, parent_comment_id, display_name')
      .eq('manhwa_id', manhwaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const rows = (data || []) as CommentWithUser[];

    // Try to fetch user records separately (no foreign key relationship)
    const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
    if (userIds.length > 0) {
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, email')
          .in('id', userIds);

        if (!usersError && usersData) {
          const usersMap = new Map<string, { id: string; username?: string | null; email?: string | null }>();
          usersData.forEach((u: any) => usersMap.set(u.id, u));
          return rows.map((r) => ({ ...r, users: usersMap.get(r.user_id) || null }));
        }
      } catch (uerr) {
        console.warn('Could not fetch users fallback for comments', uerr);
      }
    }

    return rows;
  }
}

export async function createManhwaComment(
  manhwaId: string,
  userId: string,
  content: string,
  parentCommentId?: string | null
): Promise<CommentWithUser> {
  try {
    const { data, error } = await supabase
      .from('manhwa_comments')
      .insert([
        {
          user_id: userId,
          manhwa_id: manhwaId,
          content,
          parent_comment_id: parentCommentId || null,
        },
      ])
      .select('id, user_id, content, created_at, updated_at, parent_comment_id, display_name, users(username,email)')
      .single();

    if (error) throw error;
    return data as CommentWithUser;
  } catch (err) {
    console.warn('Could not select related users for created manhwa_comment, falling back', err);
    const { data, error } = await supabase
      .from('manhwa_comments')
      .insert([
        {
          user_id: userId,
          manhwa_id: manhwaId,
          content,
          parent_comment_id: parentCommentId || null,
        },
      ])
      .select('id, user_id, content, created_at, updated_at, parent_comment_id, display_name')
      .single();

    if (error) throw error;
    return data as CommentWithUser;
  }
}

// ============================================
// Likes - Both Manhwa and Chapter Comments
// ============================================

export async function loadUserLikes(userId: string): Promise<Set<string>> {
  const allLikes = new Set<string>();

  // Load from comment_likes (for manhwa comments)
  const { data: manhwaLikes, error: error1 } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('user_id', userId);

  if (error1 && error1.code !== 'PGRST116') {
    console.warn('Warning loading manhwa likes:', error1.message);
  }
  (manhwaLikes || []).forEach(l => allLikes.add(l.comment_id));

  // Load from chapter_comment_likes (for chapter comments)
  const { data: chapterLikes, error: error2 } = await supabase
    .from('chapter_comment_likes')
    .select('comment_id')
    .eq('user_id', userId);

  if (error2 && error2.code !== 'PGRST116') {
    console.warn('Warning loading chapter likes:', error2.message);
  }
  (chapterLikes || []).forEach(l => allLikes.add(l.comment_id));

  return allLikes;
}

export async function getCommentLikesCount(commentId: string): Promise<number> {
  let totalCount = 0;

  // Count from comment_likes (for manhwa comments)
  const { count: count1, error: error1 } = await supabase
    .from('comment_likes')
    .select('*', { count: 'exact' })
    .eq('comment_id', commentId);

  if (error1 && error1.code !== 'PGRST116') {
    console.warn('Warning getting comment_likes count:', error1.message);
  }
  totalCount += count1 || 0;

  // Count from chapter_comment_likes (for chapter comments)
  const { count: count2, error: error2 } = await supabase
    .from('chapter_comment_likes')
    .select('*', { count: 'exact' })
    .eq('comment_id', commentId);

  if (error2 && error2.code !== 'PGRST116') {
    console.warn('Warning getting chapter_comment_likes count:', error2.message);
  }
  totalCount += count2 || 0;

  return totalCount;
}

export async function toggleCommentLike(
  commentId: string,
  userId: string,
  isCurrentlyLiked: boolean
): Promise<number> {
  if (isCurrentlyLiked) {
    // Delete from chapter_comment_likes
    const { error: error1 } = await supabase
      .from('chapter_comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    // Then delete from comment_likes
    const { error: error2 } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    // Ignore errors - like might not exist in either table
  } else {
    // Try to insert into chapter_comment_likes first
    const { error: chapterError } = await supabase
      .from('chapter_comment_likes')
      .insert([{ comment_id: commentId, user_id: userId }]);

    // If chapter_comment_likes insert failed, try comment_likes
    if (chapterError) {
      // Only try comment_likes if chapter insert failed
      // This is for backwards compatibility with existing chapter comments
      const { error: manhwaError } = await supabase
        .from('comment_likes')
        .insert([{ comment_id: commentId, user_id: userId }]);

      // Log if both failed (but don't throw - user just won't see the like count update)
      if (
        manhwaError &&
        chapterError.code !== 'PGRST116' &&
        manhwaError.code !== '409' &&
        manhwaError.code !== 'PGRST116'
      ) {
        console.warn('Could not insert like:', { chapterError, manhwaError });
      }
    }
  }

  return await getCommentLikesCount(commentId);
}

// ============================================
// Ratings
// ============================================

export async function loadManhwaRatings(
  manhwaId: string
): Promise<{ averageRating: number; totalRatings: number }> {
  const { data, error } = await supabase
    .from('manhwa_ratings')
    .select('rating')
    .eq('manhwa_id', manhwaId);

  if (error) throw error;

  const ratings = data || [];
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
        ratings.length
      : 0;

  return { averageRating, totalRatings: ratings.length };
}

export async function getUserRating(
  userId: string,
  manhwaId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('manhwa_ratings')
    .select('rating')
    .eq('user_id', userId)
    .eq('manhwa_id', manhwaId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.rating || null;
}

export async function saveOrUpdateRating(
  userId: string,
  manhwaId: string,
  rating: number,
  currentRating: number | null
): Promise<void> {
  if (currentRating !== null) {
    const { error } = await supabase
      .from('manhwa_ratings')
      .update({ rating })
      .eq('user_id', userId)
      .eq('manhwa_id', manhwaId);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('manhwa_ratings')
      .insert([{ user_id: userId, manhwa_id: manhwaId, rating }]);

    if (error) throw error;
  }
}