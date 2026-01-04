'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/app/providers/UserProvider';
import {
  loadManhwaRatings,
  getUserRating,
  saveOrUpdateRating,
  loadChapterComments,
  createChapterComment,
} from '../lib/comments.utils';
import {
  CommentForm,
  CommentItem,
  RepliesSection,
  LoadingState,
  EmptyState,
  CancelButton,
} from './comments-components';
import type { BaseComment } from '../lib/comments.utils';

// ============================================
// ManhwaRatingHeader
// ============================================

interface ManhwaRatingHeaderProps {
  manhwaId: string;
}

export function ManhwaRatingHeader({ manhwaId }: ManhwaRatingHeaderProps) {
  const { user } = useUser();
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        const { averageRating, totalRatings } = await loadManhwaRatings(
          manhwaId
        );
        setAverageRating(averageRating);
        setTotalRatings(totalRatings);

        if (user?.id) {
          const rating = await getUserRating(user.id, manhwaId);
          setUserRating(rating);
        }
      } catch (err) {
        console.error('Error loading ratings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRatings();
  }, [manhwaId, user?.id]);

  const handleRate = useCallback(
    async (rating: number) => {
      if (!user?.id) {
        alert('Будь ласка, увійдіть щоб оцінити манхву');
        return;
      }

      try {
        await saveOrUpdateRating(user.id, manhwaId, rating, userRating);

        const { averageRating, totalRatings } = await loadManhwaRatings(
          manhwaId
        );
        setAverageRating(averageRating);
        setTotalRatings(totalRatings);
        setUserRating(rating);
        setShowModal(false);
      } catch (err) {
        console.error('Error rating:', err);
        alert('Помилка при оцінці. Спробуйте ще раз.');
      }
    },
    [user?.id, manhwaId, userRating]
  );

  if (loading) return null;

  const STARS = Array.from({ length: 10 }, (_, i) => i + 1);
  const currentRating = hoverRating || userRating || 0;

  return (
    <>
      <div className="text-right flex-shrink-0">
        <div className="mb-3">
          <p className="text-green-400 text-3xl font-bold">
            {averageRating.toFixed(2)}
          </p>
          <p className="text-text-muted text-sm">{totalRatings} оцінок</p>
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
              <h2 className="text-2xl font-bold text-white mb-2">
                Оцініть цю манхву
              </h2>
              <p className="text-gray-400 text-sm">
                Виберіть кількість зірок від 1 до 10
              </p>
            </div>

            <div className="flex justify-center gap-3 mb-8">
              {STARS.map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-8 h-8 ${
                      star <= currentRating
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
                <p className="text-2xl font-bold text-yellow-500">
                  {hoverRating}
                </p>
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
// ChapterCommentsComponent
// ============================================

interface ChapterCommentsComponentProps {
  manhwaId: string;
  chapterId: string;
}

export function ChapterCommentsComponent({
  manhwaId,
  chapterId,
}: ChapterCommentsComponentProps) {
  const { user } = useUser();
  const [comments, setComments] = useState<BaseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadComments = async () => {
      try {
        const data = await loadChapterComments(manhwaId, chapterId);
        setComments(data);
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [manhwaId, chapterId]);

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
          user_email: user.email,
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

  return (
    <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6 mt-8">
      <h3 className="text-xl font-semibold mb-6">
        Коментарі до розділу ({comments.length})
      </h3>

      {user?.id && (
        <CommentForm
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleSubmitComment}
          disabled={submitting}
          variant="large"
        />
      )}

      {loading ? (
        <LoadingState text="Завантаження коментарів..." />
      ) : comments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment as any}
            />
          ))}
        </div>
      )}
    </div>
  );
}