'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useUser } from '@/app/providers/UserProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { deleteChapterComment, deleteChapterReply } from '@/lib/comments-actions';
import {
  loadChapterComments,
  createChapterComment,
  loadUserLikes,
  toggleCommentLike,
  getCommentLikesCount,
  type EnrichedComment,
} from '../lib/comments.utils';
import {
  CommentForm,
  CommentItem,
  RepliesSection,
  LoadingState,
  EmptyState,
  CancelButton,
} from './comments-components';
import styles from './comments.module.css';

// ============================================
// ChapterCommentsComponent
// ============================================

interface ChapterCommentsComponentProps {
  manhwaId: string;
  chapterId: string;
  mode?: 'card' | 'drawer';
  isOpen?: boolean;
  onClose?: () => void;
}

export function ChapterCommentsComponent({
  manhwaId,
  chapterId,
  mode = 'card',
  isOpen = false,
  onClose,
}: ChapterCommentsComponentProps) {
  const { user } = useUser();
  const { profile, isAdmin } = useUserProfile();
  const [comments, setComments] = useState<EnrichedComment[]>([]);
  const commentsRef = useRef<EnrichedComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  const [liking, setLiking] = useState<Set<string>>(new Set());

  // Keep ref in sync with state
  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  // Load comments when drawer opens or initially for card
  useEffect(() => {
    if (mode === 'drawer' && !isOpen) return;

    const loadComments = async () => {
      try {
        const data = await loadChapterComments(manhwaId, chapterId);
        let userLikes = new Set<string>();

        if (user?.id) {
          userLikes = await loadUserLikes(user.id);
        }

        // Enrich comments with user_email, user info and likes
        const enrichedData = await Promise.all(
          data.map(async (c) => {
            const likesCount = await getCommentLikesCount(c.id);
            
            // Enrich replies with likes count
            let enrichedReplies: any[] = [];
            if ((c as any).replies && (c as any).replies.length > 0) {
              enrichedReplies = await Promise.all(
                (c as any).replies.map(async (r: any) => {
                  const replyLikesCount = await getCommentLikesCount(r.id);
                  return {
                    ...r,
                    user_email: r.user_email || 'Анонім',
                    likes_count: replyLikesCount,
                    user_liked: userLikes.has(r.id),
                  };
                })
              );
            }

            return {
              ...c,
              display_name: (c as any).display_name || (c as any).users?.username || c.user_email || null,
              user_email: (c as any).users?.email || c.user_email || 'Анонім',
              users: (c as any).users,
              likes_count: likesCount,
              user_liked: userLikes.has(c.id),
              replies: enrichedReplies,
            } as any;
          })
        );
        // Debug log to help verify usernames are present at runtime
        if (process.env.NODE_ENV !== 'production') {
        } else {
          // also log in production for a short time to Vercel logs
        }
        setComments(enrichedData);
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [isOpen, manhwaId, chapterId, mode, user?.id, user?.email]);

  // Memoized main comments and replies getter
  const mainComments = useMemo(
    () => comments.filter((c) => !c.parent_comment_id),
    [comments]
  );

  const sortedMainComments = useMemo(() => {
    const sorted = [...mainComments];
    sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted;
  }, [mainComments]);

  const getReplies = useCallback(
    (commentId: string) => comments.filter((c) => c.parent_comment_id === commentId),
    [comments]
  );

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
      const data = await createChapterComment(
        manhwaId,
        chapterId,
        user.id,
        newComment
      );

      setComments([
        {
          ...data,
          display_name: (profile as any)?.username || (user.email || '').split('@')[0],
          user_email: user.email || 'Анонім',
          users: { username: (profile as any)?.username, email: user.email },
          likes_count: 0,
          user_liked: false,
        } as any,
        ...comments,
      ]);
      setNewComment('');
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Помилка при додаванні коментаря. Спробуйте ще раз.');
    } finally {
      setSubmitting(false);
    }
  }, [user, newComment, manhwaId, chapterId, comments]);

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
        const data = await createChapterComment(
          manhwaId,
          chapterId,
          user.id,
          replyText,
          parentCommentId
        );

        setComments([
          ...comments,
          {
            ...data,
              display_name: (profile as any)?.username || (user.email || '').split('@')[0],
              user_email: user.email || 'Анонім',
              users: { username: (profile as any)?.username, email: user.email },
            likes_count: 0,
            user_liked: false,
          } as any,
        ]);
        setReplyText('');
        setReplyingTo(null);
        setExpandedReplies(new Set([...expandedReplies, parentCommentId]));
      } catch (err) {
        console.error('Error submitting reply:', err);
        alert('Помилка при додаванні відповіді. Спробуйте ще раз.');
      } finally {
        setSubmitting(false);
      }
    },
    [user, replyText, manhwaId, chapterId, comments, expandedReplies]
  );

  // ✅ УДАЛЕНИЕ КОММЕНТАРИЯ
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        const result = await deleteChapterComment(commentId);

        if (result.success) {
          // Удалить из списка и все replies к этому комментарию
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

  // ✅ УДАЛЕНИЕ REPLY
  const handleDeleteReply = useCallback(
    async (replyId: string) => {
      try {
        const result = await deleteChapterReply(replyId);

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

  const handleLikeComment = useCallback(
    async (commentId: string, isLiked: boolean) => {
      if (!user?.id) {
        alert('Будь ласка, увійдіть щоб лайкнути');
        return;
      }

      // Prevent multiple simultaneous likes
      if (liking.has(commentId)) {
        return;
      }

      setLiking(prev => new Set([...prev, commentId]));

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
      } finally {
        setLiking(prev => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      }
    },
    [user?.id, comments, liking]
  );

  const handleLikeReply = useCallback(
    async (replyId: string) => {
      if (!user?.id) {
        alert('Будь ласка, увійдіть щоб лайкнути');
        return;
      }

      // Prevent multiple simultaneous likes
      if (liking.has(replyId)) {
        return;
      }

      // Find current state from commentsRef - replies are stored as separate comments with parent_comment_id
      const currentReply = commentsRef.current.find((c: any) => c.id === replyId);
      const isLiked = currentReply?.user_liked || false;

      setLiking(prev => new Set([...prev, replyId]));

      try {
        const newLikesCount = await toggleCommentLike(replyId, user.id, isLiked);
        
        // Update the reply in the flat comments array
        setComments((prevComments) => {
          const updated = prevComments.map((c) =>
            c.id === replyId
              ? { ...c, likes_count: newLikesCount, user_liked: !isLiked }
              : c
          );
          commentsRef.current = updated;
          return updated;
        });
      } catch (err) {
        console.error('Error liking reply:', err);
        alert('Помилка при лайкуванні. Спробуйте ще раз.');
      } finally {
        setLiking(prev => {
          const next = new Set(prev);
          next.delete(replyId);
          return next;
        });
      }
    },
    [user?.id]
  );

  // Drawer mode
  if (mode === 'drawer') {
    if (!isOpen) return null;
    
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />

        <div
          className="fixed right-0 top-0 h-screen w-full max-w-md bg-black border-l border-text-muted/20 shadow-xl z-50 transition-transform duration-300 ease-in-out translate-x-0"
        >
          <div className="flex items-center justify-between p-4 border-b border-text-muted/20">
            <h2 className="text-lg font-semibold">
              Коментарі
              <span className="text-gray-400 text-sm ml-2">
                ({mainComments.length})
              </span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-card-bg rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden p-4">
            {/* Form input at the top */}
            {user?.id && (
              <div className={styles.formContainer}>
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

            {/* Sort buttons */}
            

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <LoadingState />
              ) : sortedMainComments.length === 0 ? (
                <EmptyState />
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
                              {(comment as any).users?.username || (comment as any).user_email?.split('@')[0] || 'Анонім'}
                            </p>
                            <p className={styles.commentDate}>
                              {new Date(comment.created_at).toLocaleDateString('uk-UA')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleLikeComment(comment.id, (comment as any).user_liked || false)}
                              disabled={liking.has(comment.id)}
                              className={`${styles.likeButton} ${(comment as any).user_liked ? styles.likeButtonLiked : ''} ${liking.has(comment.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <svg className={styles.likeIcon} fill={(comment as any).user_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                              {(comment as any).likes_count || 0}
                            </button>
                            {canDelete && (
                              <button
                                title="Видалити"
                                className="p-1 hover:bg-card-hover rounded text-text-muted hover:text-red-400 transition-colors"
                                onClick={() => {
                                  if (window.confirm('Ви впевнені?')) {
                                    handleDeleteComment(comment.id);
                                  }
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <p className={styles.commentContent}>{comment.content}</p>

                        {user?.id && (
                          <button
                            onClick={() =>
                              setReplyingTo(
                                replyingTo === comment.id ? null : comment.id
                              )
                            }
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

                        <RepliesSection
                          replies={replies as any}
                          isExpanded={isExpanded}
                          onToggleExpand={() =>
                            handleToggleReplyExpand(comment.id)
                          }
                          onReplyLike={(replyId) => handleLikeReply(replyId)}
                          onReplyDelete={(replyId) => {
                            if (window.confirm('Ви впевнені?')) {
                              handleDeleteReply(replyId);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Card mode
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Коментарі до розділу ({sortedMainComments.length})</h3>

      {user?.id && (
        <div className={styles.formContainer}>
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
                      {(comment as any).users?.username || (comment as any).user_email?.split('@')[0] || 'Анонім'}
                    </p>
                    <p className={styles.commentDate}>
                      {new Date(comment.created_at).toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLikeComment(comment.id, (comment as any).user_liked || false)}
                      disabled={liking.has(comment.id)}
                      className={`${styles.likeButton} ${(comment as any).user_liked ? styles.likeButtonLiked : ''} ${liking.has(comment.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg className={styles.likeIcon} fill={(comment as any).user_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {(comment as any).likes_count || 0}
                    </button>
                    {canDelete && (
                      <button
                        title="Видалити"
                        className="p-1 hover:bg-card-hover rounded text-text-muted hover:text-red-400 transition-colors"
                        onClick={() => {
                          if (window.confirm('Ви впевнені?')) {
                            handleDeleteComment(comment.id);
                          }
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <p className={styles.commentContent}>{comment.content}</p>

                {user?.id && (
                  <button
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment.id ? null : comment.id
                      )
                    }
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

                <RepliesSection
                  replies={replies as any}
                  isExpanded={isExpanded}
                  onToggleExpand={() =>
                    handleToggleReplyExpand(comment.id)
                  }
                  onReplyLike={(replyId) => handleLikeReply(replyId)}
                  onReplyDelete={(replyId) => {
                    if (window.confirm('Ви впевнені?')) {
                      handleDeleteReply(replyId);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// ReplyForm - Вспомогательный компонент для ответов
// ============================================

interface ReplyFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  disabled: boolean;
  isSmall?: boolean;
}

function ReplyForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  disabled,
  isSmall = false,
}: ReplyFormProps) {
  return (
    <>
      <div className={styles.commentInputWrapper}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Напишіть відповідь..."
          className={`${styles.commentTextarea} ${isSmall ? styles.textareaSmall : ''}`}
          rows={2}
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className={styles.commentSendButton}
        >
          {disabled ? 'Надсилання...' : 'Відправити'}
        </button>
      </div>
      <div className={`flex gap-2 mt-2 ${isSmall ? 'gap-2' : ''}`}>
        <CancelButton onClick={onCancel} />
      </div>
    </>
  );
}