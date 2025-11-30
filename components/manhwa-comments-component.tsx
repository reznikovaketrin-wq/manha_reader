'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================
// ManhwaRatingHeader - Компактный рейтинг для заголовка
// ============================================

interface ManhwaRatingHeaderProps {
  manhwaId: string;
}

export function ManhwaRatingHeader({ manhwaId }: ManhwaRatingHeaderProps) {
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData?.user);

        const { data: allRatings } = await supabase
          .from('manhwa_ratings')
          .select('rating')
          .eq('manhwa_id', manhwaId);

        if (allRatings) {
          const avgRating =
            allRatings.length > 0
              ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
              : 0;

          setAverageRating(avgRating);
          setTotalRatings(allRatings.length);

          if (userData?.user?.id) {
            const { data: userRatingData } = await supabase
              .from('manhwa_ratings')
              .select('rating')
              .eq('user_id', userData.user.id)
              .eq('manhwa_id', manhwaId)
              .single();

            if (userRatingData) {
              setUserRating(userRatingData.rating);
            }
          }
        }
      } catch (err) {
        console.error('Error loading ratings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRatings();
  }, [manhwaId]);

  const handleRate = async (rating: number) => {
    if (!user?.id) {
      alert('Будь ласка, увійдіть щоб оцінити манхву');
      return;
    }

    try {
      if (userRating) {
        await supabase
          .from('manhwa_ratings')
          .update({ rating })
          .eq('user_id', user.id)
          .eq('manhwa_id', manhwaId);
      } else {
        await supabase
          .from('manhwa_ratings')
          .insert([
            {
              user_id: user.id,
              manhwa_id: manhwaId,
              rating,
            },
          ]);
      }

      const { data: allRatings } = await supabase
        .from('manhwa_ratings')
        .select('rating')
        .eq('manhwa_id', manhwaId);

      if (allRatings) {
        const avgRating =
          allRatings.length > 0
            ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
            : 0;

        setAverageRating(avgRating);
        setTotalRatings(allRatings.length);
        setUserRating(rating);
      }

      setShowModal(false);
    } catch (err) {
      console.error('Error rating:', err);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <div className="text-right flex-shrink-0">
        <div className="mb-3">
          <p className="text-green-400 text-3xl font-bold">{averageRating.toFixed(2)}</p>
          <p className="text-text-muted text-sm">
            {totalRatings} оцінок
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold text-sm"
        >
          Оцінити
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg border border-text-muted/20 p-8 max-w-md w-full mx-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Оцініть цю манхву</h2>
              <p className="text-gray-400 text-sm">Виберіть кількість зірок від 1 до 10</p>
            </div>

            <div className="flex justify-center gap-3 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-8 h-8 ${
                      star <= (hoverRating || userRating || 0)
                        ? 'text-yellow-500'
                        : 'text-gray-600'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>

            {hoverRating > 0 && (
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-yellow-500">{hoverRating}</p>
                <p className="text-gray-400 text-sm">зірок</p>
              </div>
            )}

            {userRating && !hoverRating && (
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm">Ваша оцінка:</p>
                <p className="text-2xl font-bold text-yellow-500">{userRating}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-card-bg hover:bg-card-hover rounded-lg transition-colors font-semibold border border-text-muted/20"
              >
                Скасувати
              </button>
              {hoverRating > 0 && (
                <button
                  onClick={() => handleRate(hoverRating)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
                >
                  Підтвердити
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// ManhwaCommentsComponent - Общие коментарии к манхве
// ============================================

interface ManhwaComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_comment_id?: string | null;
  user_email?: string;
  likes_count?: number;
  user_liked?: boolean;
}

interface ManhwaCommentsComponentProps {
  manhwaId: string;
}

export function ManhwaCommentsComponent({ manhwaId }: ManhwaCommentsComponentProps) {
  const [comments, setComments] = useState<ManhwaComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData?.user);

        // Загрузить все комментарии к манхве (включая ответы)
        const { data: commentsData, error } = await supabase
          .from('manhwa_comments')
          .select(
            `
            id,
            user_id,
            content,
            created_at,
            updated_at,
            parent_comment_id
          `
          )
          .eq('manhwa_id', manhwaId)
          .order('created_at', { ascending: false });

        if (!error && commentsData) {
          // Получить данные о лайках текущего пользователя
          let userLikes = new Set<string>();
          if (userData?.user?.id) {
            const { data: likesData } = await supabase
              .from('comment_likes')
              .select('comment_id')
              .eq('user_id', userData.user.id);
            
            userLikes = new Set(likesData?.map(l => l.comment_id) || []);
          }

          const enrichedComments = await Promise.all(
            commentsData.map(async (c) => {
              // Получить количество лайков
              const { count: likesCount } = await supabase
                .from('comment_likes')
                .select('*', { count: 'exact' })
                .eq('comment_id', c.id);

              return {
                ...c,
                user_email: userData?.user?.email || 'Анонім',
                likes_count: likesCount || 0,
                user_liked: userLikes.has(c.id),
              };
            })
          );

          setComments(enrichedComments);
        }
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [manhwaId]);

  const handleSubmitComment = async () => {
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
      const { data, error } = await supabase
        .from('manhwa_comments')
        .insert([
          {
            user_id: user.id,
            manhwa_id: manhwaId,
            content: newComment,
          },
        ])
        .select();

      if (!error && data) {
        const newCommentData = {
          ...data[0],
          user_email: user.email,
          likes_count: 0,
          user_liked: false,
        };
        setComments([newCommentData, ...comments]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
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
      const { data } = await supabase
        .from('manhwa_comments')
        .insert([
          {
            user_id: user.id,
            manhwa_id: manhwaId,
            content: replyText,
            parent_comment_id: parentCommentId,
          },
        ])
        .select();

      if (data) {
        const newReply = {
          ...data[0],
          user_email: user.email,
          likes_count: 0,
          user_liked: false,
        };
        setComments([...comments, newReply]);
        setReplyText('');
        setReplyingTo(null);

        // Раскрыть ответы
        setExpandedReplies(new Set([...expandedReplies, parentCommentId]));
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user?.id) {
      alert('Будь ласка, увійдіть щоб лайкнути коментар');
      return;
    }

    try {
      if (isLiked) {
        // Удалить лайк
        await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
      } else {
        // Добавить лайк
        await supabase
          .from('comment_likes')
          .insert([
            {
              user_id: user.id,
              comment_id: commentId,
            },
          ]);
      }

      // Обновить локальное состояние
      setComments(
        comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                user_liked: !isLiked,
                likes_count: (c.likes_count || 0) + (isLiked ? -1 : 1),
              }
            : c
        )
      );
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const getReplies = (commentId: string) => {
    return comments.filter(c => c.parent_comment_id === commentId);
  };

  const mainComments = comments.filter(c => !c.parent_comment_id);

  const sortedComments = [...mainComments].sort((a, b) => {
    if (sortBy === 'popular') {
      return (b.likes_count || 0) - (a.likes_count || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6">
      <h3 className="text-xl font-semibold mb-6">Коментарі до тайтла ({mainComments.length})</h3>

      {/* New Comment Form */}
      {user?.id && (
        <div className="mb-6 pb-6 border-b border-text-muted/20">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Поділіться своєю думкою про цю манхву..."
            className="w-full bg-black border border-text-muted/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-3 gap-2">
            <button
              onClick={() => setNewComment('')}
              className="px-6 py-2 bg-card-bg hover:bg-card-hover rounded-lg transition-colors font-semibold"
            >
              Скасувати
            </button>
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold"
            >
              {submitting ? 'Надсилання...' : 'Надіслати'}
            </button>
          </div>
        </div>
      )}

      {!user?.id && (
        <div className="mb-6 pb-6 border-b border-text-muted/20 bg-blue-600/10 border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-gray-300">
            Щоб залишити коментар, будь ласка{' '}
            <a href="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              увійдіть в свій акаунт
            </a>
          </p>
        </div>
      )}

      {/* Sort Buttons */}
      {mainComments.length > 0 && (
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              sortBy === 'recent'
                ? 'bg-blue-600 text-white'
                : 'bg-card-bg text-gray-400 hover:text-gray-300'
            }`}
          >
            Нові
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              sortBy === 'popular'
                ? 'bg-blue-600 text-white'
                : 'bg-card-bg text-gray-400 hover:text-gray-300'
            }`}
          >
            Популярні
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-gray-400 text-center py-8">Завантаження коментарів...</div>
      ) : sortedComments.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          Коментарів ще немає. Будьте першим!
        </div>
      ) : (
        <div className="space-y-4">
          {sortedComments.map((comment) => {
            const replies = getReplies(comment.id);
            const isExpanded = expandedReplies.has(comment.id);

            return (
              <div key={comment.id} className="border-l-2 border-blue-500 pl-4">
                {/* Comment Header */}
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-gray-200">
                    {comment.user_email?.split('@')[0] || 'Анонім'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString('uk-UA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Comment Content */}
                <p className="text-gray-300 text-sm mb-3 leading-relaxed">{comment.content}</p>

                {/* Comment Actions */}
                <div className="flex items-center gap-4 text-xs mb-3">
                  <button
                    onClick={() =>
                      handleLikeComment(comment.id, comment.user_liked || false)
                    }
                    className={`flex items-center gap-1 transition-colors ${
                      comment.user_liked
                        ? 'text-red-500 hover:text-red-400'
                        : 'text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill={comment.user_liked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      />
                    </svg>
                    {comment.likes_count || 0}
                  </button>

                  {/* Reply Button */}
                  {user?.id && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      ↳ Відповісти
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="mb-4 pl-4 border-l-2 border-blue-400">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Напишіть відповідь..."
                      className="w-full bg-black border border-text-muted/20 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={submitting || !replyText.trim()}
                        className="px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-semibold"
                      >
                        Відправити
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        className="px-4 py-1 bg-card-bg hover:bg-card-hover border border-text-muted/20 rounded text-sm font-semibold"
                      >
                        Скасувати
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies Section */}
                {replies.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        if (isExpanded) {
                          const newExpanded = new Set(expandedReplies);
                          newExpanded.delete(comment.id);
                          setExpandedReplies(newExpanded);
                        } else {
                          setExpandedReplies(new Set([...expandedReplies, comment.id]));
                        }
                      }}
                      className="text-xs text-gray-400 hover:text-gray-300 font-medium"
                    >
                      {isExpanded ? '▼' : '▶'} Відповідей: {replies.length}
                    </button>

                    {/* Replies List */}
                    {isExpanded && (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-400">
                        {replies.map((reply) => (
                          <div key={reply.id} className="border-l-2 border-green-500 pl-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-xs">
                                {reply.user_email?.split('@')[0] || 'Анонім'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleDateString('uk-UA')}
                              </p>
                            </div>
                            <p className="text-gray-300 text-sm">{reply.content}</p>

                            {/* Reply Actions */}
                            <button
                              onClick={() =>
                                handleLikeComment(reply.id, reply.user_liked || false)
                              }
                              className={`mt-2 flex items-center gap-1 text-xs transition-colors ${
                                reply.user_liked
                                  ? 'text-red-500 hover:text-red-400'
                                  : 'text-gray-500 hover:text-gray-400'
                              }`}
                            >
                              <svg
                                className="w-3 h-3"
                                fill={reply.user_liked ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                />
                              </svg>
                              {reply.likes_count || 0}
                            </button>
                          </div>
                        ))}
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
}