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
              ? allRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / allRatings.length
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
            ? allRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / allRatings.length
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
      {/* Компактное отображение рейтинга в заголовке */}
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

      {/* Модальное окно с 10 звёздами */}
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
// ChapterCommentsComponent - Комментарии к главам
// ============================================

interface ChapterComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  likes_count?: number;
  user_liked?: boolean;
}

interface ChapterCommentsComponentProps {
  manhwaId: string;
  chapterId: string;
}

export function ChapterCommentsComponent({
  manhwaId,
  chapterId,
}: ChapterCommentsComponentProps) {
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData?.user);

        const { data: commentsData } = await supabase
          .from('chapter_comments')
          .select('id, user_id, content, created_at, updated_at')
          .eq('manhwa_id', manhwaId)
          .eq('chapter_id', chapterId)
          .is('parent_comment_id', null)
          .order('created_at', { ascending: false });

        if (commentsData) {
          setComments(commentsData as any);
        }
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [manhwaId, chapterId]);

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
      const { data } = await supabase
        .from('chapter_comments')
        .insert([
          {
            user_id: user.id,
            manhwa_id: manhwaId,
            chapter_id: chapterId,
            content: newComment,
          },
        ])
        .select();

      if (data) {
        setComments([
          {
            ...data[0],
            user_email: user.email,
          } as any,
          ...comments,
        ]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6 mt-8">
      <h3 className="text-xl font-semibold mb-6">Коментарі до розділу ({comments.length})</h3>

      {user?.id && (
        <div className="mb-6 pb-6 border-b border-text-muted/20">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Напишіть коментар..."
            className="w-full bg-black border border-text-muted/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-3">
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

      {loading ? (
        <div className="text-gray-400">Завантаження коментарів...</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          Коментарів ще немає. Будьте першим!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-blue-500 pl-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">
                  {comment.user_email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(comment.created_at).toLocaleDateString('uk-UA')}
                </p>
              </div>
              <p className="text-gray-300 text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}