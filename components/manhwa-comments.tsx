'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useUser } from '@/app/providers/UserProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { deleteComment, deleteReply } from '@/lib/comments-actions';
import {
  loadManhwaComments,
  createManhwaComment,
  loadUserLikes,
  toggleCommentLike,
  getCommentLikesCount,
  type EnrichedComment,
} from '@/lib/comments.utils';
import styles from './comments.module.css';

interface ManhwaCommentsComponentProps {
  manhwaId: string;
  hideHeader?: boolean;
  onCommentsCountChange?: (count: number) => void;
}

export const ManhwaCommentsComponent = memo(function ManhwaCommentsComponent({
  manhwaId,
  hideHeader = false,
  onCommentsCountChange,
}: ManhwaCommentsComponentProps) {
  const { user } = useUser();
  const { profile, isAdmin } = useUserProfile();
  const [comments, setComments] = useState<EnrichedComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadComments = async () => {
      try {
        const commentsData = await loadManhwaComments(manhwaId);
        let userLikes = new Set<string>();

        if (user?.id) {
          userLikes = await loadUserLikes(user.id);
        }

        const enrichedComments = await Promise.all(
          commentsData.map(async (c) => {
            const likesCount = await getCommentLikesCount(c.id);
            const enriched = {
              ...c,
              display_name: (c as any).display_name || (c as any).users?.username || c.user_email || null,
              // Prefer username from joined user record, otherwise try email
              user_email: (c as any).users?.email || c.user_email || 'Анонім',
              likes_count: likesCount,
              user_liked: userLikes.has(c.id),
              // keep users object so UI can show username immediately
              users: (c as any).users,
            };
            
            // Debug log
            if (process.env.NODE_ENV !== 'production') {
            }
            
            return enriched;
          })
        );

        setComments(enrichedComments);
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [manhwaId, user?.id]);

  useEffect(() => {
    const mainCommentsList = comments.filter((c) => !c.parent_comment_id);
    onCommentsCountChange?.(mainCommentsList.length);
  }, [comments, onCommentsCountChange]);

  const mainComments = useMemo(
    () => comments.filter((c) => !c.parent_comment_id),
    [comments]
  );

  const sortedMainComments = useMemo(() => {
    const sorted = [...mainComments];
    if (sortBy === 'popular') {
      sorted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }, [mainComments, sortBy]);

  const getReplies = useCallback(
    (commentId: string) => comments.filter((c) => c.parent_comment_id === commentId),
    [comments]
  );

  const formatAuthor = (c: EnrichedComment) => {
    const displayName = (c as any).display_name;
    if (displayName && String(displayName).trim()) return String(displayName);

    const usersObj = (c as any).users;
    const username = usersObj?.username;
    if (username && String(username).trim()) return String(username);
    
    // Fallback to email username part
    const email = c.user_email || (c as any).users?.email;
    if (email && email !== 'Анонім') {
      return email.split('@')[0];
    }
    
    return 'Анонім';
  };

  const handleSubmitComment = useCallback(async () => {
    if (!user?.id) {
      alert('Будь ласка, увійдіть щоб залишити коментар');
      return;
    }

    if (!newComment.trim()) {
      alert('Коментар не може бути порожнім');
      return;
    }

    setSubmitting(true);

    try {
      const data = await createManhwaComment(manhwaId, user.id, newComment);
      const newEnrichedComment: EnrichedComment = {
        ...data,
        display_name: (profile as any)?.username || (user.email || '').split('@')[0],
        user_email: user.email,
        // Attach current user's username/email so UI shows username immediately
        users: { username: (profile as any)?.username, email: user.email },
        likes_count: 0,
        user_liked: false,
      };

      setComments([newEnrichedComment, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Помилка при додаванні коментаря. Спробуйте ще раз.');
    } finally {
      setSubmitting(false);
    }
  }, [user, newComment, manhwaId, comments]);

  const handleSubmitReply = useCallback(
    async (parentCommentId: string) => {
      if (!user?.id) {
        alert('Будь ласка, увійдіть щоб залишити відповідь');
        return;
      }

      if (!replyText.trim()) {
        alert('Відповідь не може бути порожною');
        return;
      }

      setSubmitting(true);

      try {
        const data = await createManhwaComment(manhwaId, user.id, replyText, parentCommentId);
        const newReply: EnrichedComment = {
          ...data,
          display_name: (profile as any)?.username || (user.email || '').split('@')[0],
          user_email: user.email,
          likes_count: 0,
          user_liked: false,
        };

        setComments([...comments, newReply]);
        setReplyText('');
        setReplyingTo(null);
      } catch (err) {
        console.error('Error submitting reply:', err);
        alert('Помилка при додаванні відповіді. Спробуйте ще раз.');
      } finally {
        setSubmitting(false);
      }
    },
    [user, replyText, manhwaId, comments]
  );

  const handleLikeComment = useCallback(
    async (commentId: string, isLiked: boolean) => {
      if (!user?.id) {
        alert('Будь ласка, увійдіть щоб лайкнути');
        return;
      }

      try {
        const newLikesCount = await toggleCommentLike(commentId, user.id, isLiked);
        setComments(
          comments.map((c) =>
            c.id === commentId
              ? { ...c, likes_count: newLikesCount, user_liked: !isLiked }
              : c
          )
        );
      } catch (err) {
        console.error('Error liking comment:', err);
        alert('Помилка при лайкуванні. Спробуйте ще раз.');
      }
    },
    [user?.id, comments]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!window.confirm('Ви впевнені? Коментар буде видалено навічно.')) {
        return;
      }

      try {
        const result = await deleteComment(commentId);

        if (result.success) {
          setComments(comments.filter(c => c.id !== commentId && c.parent_comment_id !== commentId));
        } else {
          alert('Помилка при видаленні: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Неочікувана помилка');
      }
    },
    [comments]
  );

  const handleDeleteReply = useCallback(
    async (replyId: string) => {
      if (!window.confirm('Ви впевнені? Відповідь буде видалена навічно.')) {
        return;
      }

      try {
        const result = await deleteReply(replyId);

        if (result.success) {
          setComments(comments.filter(c => c.id !== replyId));
        } else {
          alert('Помилка при видаленні: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting reply:', error);
        alert('Неочікувана помилка');
      }
    },
    [comments]
  );

  const handleToggleReplyExpand = useCallback((commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }, []);

  return (
    <div className={styles.container}>
      {/* ✅ ЗАГОЛОВОК ТОЛЬКО ДЛЯ DESKTOP */}
      {!hideHeader && (
        <div className={styles.headerDesktop}>
          <h3 className={styles.title}>Коментарі ({sortedMainComments.length})</h3>
        </div>
      )}

      {user?.id && (
        <div className={styles.formContainer}>
          {/* Поле ввода комментария */}
          <div className={styles.commentInputWrapper}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Напишіть коментар..."
              className={styles.commentTextarea}
            />
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className={styles.commentSendButton}
            >
              {submitting ? '...' : 'Надіслати'}
            </button>
          </div>
        </div>
      )}

      {/* Блок "Увійдіть" */}
      {!user?.id && (
        <div className={styles.authMessage}>
          <p className={styles.authText}>
            <a href="/auth" className={styles.authLink}>
              Увійдіть
            </a>
            {' '}щоб залишити коментар
          </p>
        </div>
      )}

      {/* ✅ КНОПКИ СОРТИРОВКИ ПОД БЛОКОМ "Увійдіть" */}
      <div className={styles.sortButtons}>
        <button
          onClick={() => setSortBy('recent')}
          className={`${styles.sortButton} ${sortBy === 'recent' ? styles.active : ''}`}
        >
          Недавні
        </button>
        <button
          onClick={() => setSortBy('popular')}
          className={`${styles.sortButton} ${sortBy === 'popular' ? styles.active : ''}`}
        >
          Популярні
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Завантаження коментарів...</div>
      ) : sortedMainComments.length === 0 ? (
        <div className={styles.empty}>Коментарів ще немає. Будьте першим!</div>
      ) : (
        <div className={styles.commentsList}>
          {sortedMainComments.map((comment) => {
            const replies = getReplies(comment.id);
            const isExpanded = expandedReplies.has(comment.id);
            const canDelete = isAdmin;

            return (
              <div key={comment.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentInfo}>
                    <p className={styles.commentAuthor}>
                      {formatAuthor(comment)}
                    </p>
                    <p className={styles.commentDate}>
                      {new Date(comment.created_at).toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLikeComment(comment.id, comment.user_liked || false)}
                      className={`${styles.likeButton} ${comment.user_liked ? styles.likeButtonLiked : ''}`}
                    >
                      <svg className={styles.likeIcon} fill={comment.user_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {comment.likes_count || 0}
                    </button>

                    {canDelete && (
                      <button
                        title="Видалити"
                        className="p-2 hover:bg-card-hover rounded text-text-muted hover:text-red-400 transition-colors"
                        onClick={() => {
                          const confirmed = window.confirm('Ви впевнені?');
                          if (confirmed) {
                            handleDeleteComment(comment.id);
                          }
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <p className={styles.commentContent}>{comment.content}</p>

                {user?.id && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className={styles.replyButton}
                  >
                    ↳ Відповісти
                  </button>
                )}

                {replyingTo === comment.id && (
                  <div className={styles.replyFormContainer}>
                    <div className={styles.commentInputWrapper}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Напишіть відповідь..."
                        className={styles.commentTextarea}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey && replyText.trim()) {
                            handleSubmitReply(comment.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={submitting || !replyText.trim()}
                        className={styles.commentSendButton}
                      >
                        {submitting ? '...' : 'Надіслати'}
                      </button>
                    </div>
                  </div>
                )}

                {replies.length > 0 && (
                  <div className={styles.expandButtonsContainer}>
                    <button
                      onClick={() => handleToggleReplyExpand(comment.id)}
                      className={styles.expandButton}
                    >
                      {isExpanded ? '▼' : '▶'} Відповідей: {replies.length}
                    </button>

                    {isExpanded && (
                      <div className={styles.repliesContainer}>
                        {replies.map((reply) => {
                          const canDeleteReply = isAdmin;

                          return (
                            <div key={reply.id} className={styles.reply}>
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className={styles.replyAuthor}>
                                    {formatAuthor(reply)}
                                  </p>
                                </div>

                                {canDeleteReply && (
                                  <button
                                    title="Видалити"
                                    className="p-1 hover:bg-card-hover rounded text-text-muted hover:text-red-400 transition-colors"
                                    onClick={() => {
                                      const confirmed = window.confirm('Ви впевнені?');
                                      if (confirmed) {
                                        handleDeleteReply(reply.id);
                                      }
                                    }}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>

                              <p className={styles.replyContent}>{reply.content}</p>
                              <button
                                onClick={() => handleLikeComment(reply.id, reply.user_liked || false)}
                                className={`${styles.likeButton} ${reply.user_liked ? styles.likeButtonLiked : ''}`}
                              >
                                <svg className={styles.likeIconSmall} fill={reply.user_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {reply.likes_count || 0}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ManhwaCommentsComponent;