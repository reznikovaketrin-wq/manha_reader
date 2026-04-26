// lib/comments-actions.ts
// ✅ Server Actions для управления комментариями

'use server';

import { getCurrentUser } from './auth';
import { getSupabaseServerClient } from './supabase-server';

/**
 * Удалить комментарий
 * ✅ Админ может удалить любой
 * ✅ Пользователь может удалить только свой
 */
export async function deleteComment(commentId: string) {
  if (process.env.NODE_ENV !== 'production') {
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    console.error('❌ [deleteComment] Not authenticated');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const supabase = await getSupabaseServerClient();

    // Проверяем роль пользователя из БД
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    // ✅ ШАГ 1: Получаем комментарий
    const { data: comment, error: fetchError } = await supabase
      .from('manhwa_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      console.error('❌ [deleteComment] Comment not found:', fetchError);
      return { success: false, error: 'Comment not found' };
    }

    if (process.env.NODE_ENV !== 'production') {
    }

    // ✅ ШАГ 2: Проверяем права
    // Если админ - удаляем всё
    if (isAdmin) {
      if (process.env.NODE_ENV !== 'production') {
      }
    }
    // Если обычный пользователь - проверяем что это его комментарий
    else if (comment.user_id !== currentUser.id) {
      console.error('❌ [deleteComment] Not authorized - not own comment');
      return { success: false, error: 'Not authorized' };
    } else {
      if (process.env.NODE_ENV !== 'production') {
      }
    }

    // ✅ ШАГ 3: Удаляем комментарий
    const { error: deleteError } = await supabase
      .from('manhwa_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('❌ [deleteComment] Delete error:', deleteError);
      return { success: false, error: deleteError.message };
    }

    if (process.env.NODE_ENV !== 'production') {
    }
    return { success: true };
  } catch (error) {
    console.error('❌ [deleteComment] Exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Удалить reply (ответ на комментарий)
 * ✅ Replies хранятся в таблице manhwa_comments с parent_comment_id
 * ✅ Админ может удалить любой reply
 * ✅ Пользователь может удалить только свой reply
 */
export async function deleteReply(replyId: string) {
  if (process.env.NODE_ENV !== 'production') {
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    console.error('❌ [deleteReply] Not authenticated');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const supabase = await getSupabaseServerClient();

    // Проверяем роль пользователя из БД
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    // ✅ ШАГ 1: Получаем reply из manhwa_comments (replies хранятся там с parent_comment_id!)
    const { data: reply, error: fetchError } = await supabase
      .from('manhwa_comments')
      .select('id, user_id, parent_comment_id')
      .eq('id', replyId)
      .single();

    if (fetchError || !reply) {
      console.error('❌ [deleteReply] Reply not found:', fetchError);
      return { success: false, error: 'Reply not found' };
    }

    if (process.env.NODE_ENV !== 'production') {
    }

    // ✅ ШАГ 2: Проверяем права
    if (isAdmin) {
      if (process.env.NODE_ENV !== 'production') {
      }
    } else if (reply.user_id !== currentUser.id) {
      console.error('❌ [deleteReply] Not authorized');
      return { success: false, error: 'Not authorized' };
    } else {
      if (process.env.NODE_ENV !== 'production') {
      }
    }

    // ✅ ШАГ 3: Удаляем reply из manhwa_comments
    const { error: deleteError } = await supabase
      .from('manhwa_comments')
      .delete()
      .eq('id', replyId);

    if (deleteError) {
      console.error('❌ [deleteReply] Delete error:', deleteError);
      return { success: false, error: deleteError.message };
    }

    if (process.env.NODE_ENV !== 'production') {
    }
    return { success: true };
  } catch (error) {
    console.error('❌ [deleteReply] Exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Удалить комментарий раздела (chapter comment)
 * Аналогично `deleteComment`, но для таблицы `chapter_comments`
 */
export async function deleteChapterComment(commentId: string) {
  if (process.env.NODE_ENV !== 'production') {
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    console.error('❌ [deleteChapterComment] Not authenticated');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const supabase = await getSupabaseServerClient();

    // Проверяем роль пользователя из БД
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    const { data: comment, error: fetchError } = await supabase
      .from('chapter_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      console.error('❌ [deleteChapterComment] Comment not found:', fetchError);
      return { success: false, error: 'Comment not found' };
    }

    if (process.env.NODE_ENV !== 'production') {
    }

    if (isAdmin) {
      if (process.env.NODE_ENV !== 'production') {
      }
    } else if (comment.user_id !== currentUser.id) {
      console.error('❌ [deleteChapterComment] Not authorized - not own comment');
      return { success: false, error: 'Not authorized' };
    } else {
      if (process.env.NODE_ENV !== 'production') {
      }
    }

    const { error: deleteError } = await supabase
      .from('chapter_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('❌ [deleteChapterComment] Delete error:', deleteError);
      console.error('❌ [deleteChapterComment] Delete failed - possibly RLS policy issue. Admin:', isAdmin, 'User:', currentUser.id);
      return { success: false, error: deleteError.message };
    }

    if (process.env.NODE_ENV !== 'production') {
    }
    return { success: true };
  } catch (error) {
    console.error('❌ [deleteChapterComment] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Удалить reply для chapter comments
 */
export async function deleteChapterReply(replyId: string) {
  if (process.env.NODE_ENV !== 'production') {
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    console.error('❌ [deleteChapterReply] Not authenticated');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const supabase = await getSupabaseServerClient();

    // Проверяем роль пользователя из БД
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    const { data: reply, error: fetchError } = await supabase
      .from('chapter_comments')
      .select('id, user_id, parent_comment_id')
      .eq('id', replyId)
      .single();

    if (fetchError || !reply) {
      console.error('❌ [deleteChapterReply] Reply not found:', fetchError);
      return { success: false, error: 'Reply not found' };
    }

    if (process.env.NODE_ENV !== 'production') {
    }

    if (isAdmin) {
      if (process.env.NODE_ENV !== 'production') {
      }
    } else if (reply.user_id !== currentUser.id) {
      console.error('❌ [deleteChapterReply] Not authorized');
      return { success: false, error: 'Not authorized' };
    } else {
      if (process.env.NODE_ENV !== 'production') {
      }
    }

    const { error: deleteError } = await supabase
      .from('chapter_comments')
      .delete()
      .eq('id', replyId);

    if (deleteError) {
      console.error('❌ [deleteChapterReply] Delete error:', deleteError);
      console.error('❌ [deleteChapterReply] Delete failed - possibly RLS policy issue. Admin:', isAdmin, 'User:', currentUser.id);
      return { success: false, error: deleteError.message };
    }

    if (process.env.NODE_ENV !== 'production') {
    }
    return { success: true };
  } catch (error) {
    console.error('❌ [deleteChapterReply] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}