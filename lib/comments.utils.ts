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
}

// ============================================
// Chapter Comments
// ============================================

export async function loadChapterComments(
  manhwaId: string,
  chapterId: string
): Promise<BaseComment[]> {
  const { data, error } = await supabase
    .from('chapter_comments')
    .select('id, user_id, content, created_at, updated_at, parent_comment_id')
    .eq('manhwa_id', manhwaId)
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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
): Promise<BaseComment[]> {
  const { data, error } = await supabase
    .from('manhwa_comments')
    .select('id, user_id, content, created_at, updated_at, parent_comment_id')
    .eq('manhwa_id', manhwaId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createManhwaComment(
  manhwaId: string,
  userId: string,
  content: string,
  parentCommentId?: string | null
): Promise<BaseComment> {
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
    .select()
    .single();

  if (error) throw error;
  return data;
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