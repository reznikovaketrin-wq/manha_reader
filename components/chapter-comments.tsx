'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================
// ChapterCommentsComponent - Коментарии к главам с ответами
// Может работать как карточка или как боковая панель (drawer)
// ============================================

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  parent_comment_id?: string | null;
}

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (mode === 'drawer' && !isOpen) return;

    const loadData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData?.user);

        const { data: commentsData } = await supabase
          .from('chapter_comments')
          .select('id, user_id, content, created_at, updated_at, parent_comment_id')
          .eq('manhwa_id', manhwaId)
          .eq('chapter_id', chapterId)
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
  }, [isOpen, manhwaId, chapterId, mode]);

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
        .from('chapter_comments')
        .insert([
          {
            user_id: user.id,
            manhwa_id: manhwaId,
            chapter_id: chapterId,
            content: replyText,
            parent_comment_id: parentCommentId,
          },
        ])
        .select();

      if (data) {
        setComments([
          ...comments,
          {
            ...data[0],
            user_email: user.email,
          } as any,
        ]);
        setReplyText('');
        setReplyingTo(null);
        setExpandedReplies(new Set([...expandedReplies, parentCommentId]));
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getReplies = (commentId: string) => {
    return comments.filter(c => c.parent_comment_id === commentId);
  };

  const mainComments = comments.filter(c => !c.parent_comment_id);

  // Режим drawer
  if (mode === 'drawer') {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={onClose}
          />
        )}

        <div
          className={`fixed right-0 top-0 h-screen w-full max-w-full md:max-w-md bg-black border-l border-text-muted/20 shadow-xl z-50 transition-transform duration-300 ease-in-out transform ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-text-muted/20">
            <h2 className="text-lg font-semibold">
              Коментарі
              <span className="text-gray-400 text-sm ml-2">({mainComments.length})</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-card-bg rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-gray-400 text-center py-8">Завантаження...</div>
              ) : mainComments.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  Коментарів ще немає. Будьте першим!
                </div>
              ) : (
                <div className="space-y-4">
                  {mainComments.map((comment) => {
                    const replies = getReplies(comment.id);
                    const isExpanded = expandedReplies.has(comment.id);

                    return (
                      <div key={comment.id} className="border-l-2 border-blue-500 pl-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-xs">
                            {comment.user_email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString('uk-UA')}
                          </p>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{comment.content}</p>

                        {user?.id && (
                          <button
                            onClick={() =>
                              setReplyingTo(replyingTo === comment.id ? null : comment.id)
                            }
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                          >
                            ↳ Відповісти
                          </button>
                        )}

                        {replyingTo === comment.id && (
                          <div className="mt-2 pl-3 border-l-2 border-blue-400">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Відповідь..."
                              className="w-full bg-black border border-text-muted/20 rounded px-2 py-1 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                              rows={2}
                            />
                            <div className="flex gap-1 mt-1">
                              <button
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={submitting || !replyText.trim()}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs rounded font-semibold"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                                className="px-2 py-1 bg-card-bg hover:bg-card-hover border border-text-muted/20 text-xs rounded font-semibold"
                              >
                                Скасувати
                              </button>
                            </div>
                          </div>
                        )}

                        {replies.length > 0 && (
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                if (isExpanded) {
                                  const newExpanded = new Set(expandedReplies);
                                  newExpanded.delete(comment.id);
                                  setExpandedReplies(newExpanded);
                                } else {
                                  setExpandedReplies(
                                    new Set([...expandedReplies, comment.id])
                                  );
                                }
                              }}
                              className="text-xs text-gray-400 hover:text-gray-300"
                            >
                              {isExpanded ? '▼' : '▶'} ({replies.length})
                            </button>

                            {isExpanded && (
                              <div className="mt-2 space-y-2 pl-3 border-l-2 border-blue-400">
                                {replies.map((reply) => (
                                  <div key={reply.id} className="border-l-2 border-green-500 pl-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="font-semibold text-xs">
                                        {reply.user_email?.split('@')[0]}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {new Date(reply.created_at).toLocaleDateString('uk-UA')}
                                      </p>
                                    </div>
                                    <p className="text-gray-300 text-xs">{reply.content}</p>
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

            {user?.id && (
              <div className="border-t border-text-muted/20 p-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Напишіть коментар..."
                  className="w-full bg-black border border-text-muted/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  rows={2}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                  className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold text-sm"
                >
                  {submitting ? 'Надсилання...' : 'Надіслати'}
                </button>
              </div>
            )}

            {!user?.id && (
              <div className="border-t border-text-muted/20 p-4 bg-blue-600/10">
                <p className="text-xs text-gray-300">
                  <a href="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                    Увійдіть
                  </a>{' '}
                  щоб залишити коментар
                </p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Режим card
  return (
    <div className="bg-card-bg rounded-lg border border-text-muted/20 p-6 mt-8">
      <h3 className="text-xl font-semibold mb-6">Коментарі до розділу ({mainComments.length})</h3>

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
      ) : mainComments.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          Коментарів ще немає. Будьте першим!
        </div>
      ) : (
        <div className="space-y-4">
          {mainComments.map((comment) => {
            const replies = getReplies(comment.id);
            const isExpanded = expandedReplies.has(comment.id);

            return (
              <div key={comment.id} className="border-l-2 border-blue-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">
                    {comment.user_email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleDateString('uk-UA')}
                  </p>
                </div>
                <p className="text-gray-300 text-sm mb-3">{comment.content}</p>

                {user?.id && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium mb-3"
                  >
                    ↳ Відповісти
                  </button>
                )}

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

                    {isExpanded && (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-400">
                        {replies.map((reply) => (
                          <div key={reply.id} className="border-l-2 border-green-500 pl-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-xs">
                                {reply.user_email?.split('@')[0]}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleDateString('uk-UA')}
                              </p>
                            </div>
                            <p className="text-gray-300 text-sm">{reply.content}</p>
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