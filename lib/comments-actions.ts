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
    console.log('🗑️ [deleteComment] Attempting to delete comment:', commentId);
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    console.error('❌ [deleteComment] Not authenticated');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const supabase = await getSupabaseServerClient();

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
      console.log('📋 [deleteComment] Found comment, user_id:', comment.user_id);
    }

    // ✅ ШАГ 2: Проверяем права
    // Если админ - удаляем всё
    if (currentUser.user_metadata?.role === 'admin') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('👑 [deleteComment] Admin delete allowed');
      }
    }
    // Если обычный пользователь - проверяем что это его комментарий
    else if (comment.user_id !== currentUser.id) {
      console.error('❌ [deleteComment] Not authorized - not own comment');
      return { success: false, error: 'Not authorized' };
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ [deleteComment] User can delete own comment');
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
      console.log('✅ [deleteComment] Comment deleted successfully');
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
    console.log('🗑️ [deleteReply] Attempting to delete reply:', replyId);
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    console.error('❌ [deleteReply] Not authenticated');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const supabase = await getSupabaseServerClient();

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
      console.log('📋 [deleteReply] Found reply, user_id:', reply.user_id);
    }

    // ✅ ШАГ 2: Проверяем права
    if (currentUser.user_metadata?.role === 'admin') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('👑 [deleteReply] Admin delete allowed');
      }
    } else if (reply.user_id !== currentUser.id) {
      console.error('❌ [deleteReply] Not authorized');
      return { success: false, error: 'Not authorized' };
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ [deleteReply] User can delete own reply');
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
      console.log('✅ [deleteReply] Reply deleted successfully');
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
    console.log('🗑️ [deleteChapterComment] Attempting to delete chapter comment:', commentId);
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    console.error('❌ [deleteChapterComment] Not authenticated');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const supabase = await getSupabaseServerClient();

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
      console.log('📋 [deleteChapterComment] Found comment, user_id:', comment.user_id);
    }

    if (currentUser.user_metadata?.role === 'admin') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('👑 [deleteChapterComment] Admin delete allowed');
      }
    } else if (comment.user_id !== currentUser.id) {
      console.error('❌ [deleteChapterComment] Not authorized - not own comment');
      return { success: false, error: 'Not authorized' };
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ [deleteChapterComment] User can delete own comment');
      }
    }

    const { error: deleteError } = await supabase
      .from('chapter_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('❌ [deleteChapterComment] Delete error:', deleteError);
      return { success: false, error: deleteError.message };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ [deleteChapterComment] Comment deleted successfully');
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
    console.log('🗑️ [deleteChapterReply] Attempting to delete chapter reply:', replyId);
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    console.error('❌ [deleteChapterReply] Not authenticated');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const supabase = await getSupabaseServerClient();

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
      console.log('📋 [deleteChapterReply] Found reply, user_id:', reply.user_id);
    }

    if (currentUser.user_metadata?.role === 'admin') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('👑 [deleteChapterReply] Admin delete allowed');
      }
    } else if (reply.user_id !== currentUser.id) {
      console.error('❌ [deleteChapterReply] Not authorized');
      return { success: false, error: 'Not authorized' };
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ [deleteChapterReply] User can delete own reply');
      }
    }

    const { error: deleteError } = await supabase
      .from('chapter_comments')
      .delete()
      .eq('id', replyId);

    if (deleteError) {
      console.error('❌ [deleteChapterReply] Delete error:', deleteError);
      return { success: false, error: deleteError.message };
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ [deleteChapterReply] Reply deleted successfully');
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