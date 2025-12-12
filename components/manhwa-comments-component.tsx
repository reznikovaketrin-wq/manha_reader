'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  hideHeader?: boolean;
  onCommentsCountChange?: (count: number) => void;
}

export function ManhwaCommentsComponent({ 
  manhwaId, 
  hideHeader = false, 
  onCommentsCountChange 
}: ManhwaCommentsComponentProps) {
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

  useEffect(() => {
    const mainCommentsList = comments.filter(c => !c.parent_comment_id);
    onCommentsCountChange?.(mainCommentsList.length);
  }, [comments, onCommentsCountChange]);

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
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user?.id) {
      alert('Будь ласка, увійдіть щоб лайкнути');
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('comment_likes')
          .insert([
            {
              comment_id: commentId,
              user_id: user.id,
            },
          ]);
      }

      const { count: newCount } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact' })
        .eq('comment_id', commentId);

      setComments(
        comments.map(c =>
          c.id === commentId
            ? {
                ...c,
                likes_count: newCount || 0,
                user_liked: !isLiked,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Заголовок */}
      {!hideHeader && (
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/icons/comments-icon.png" alt="Comments" style={{ width: '20px', height: '20px' }} />
          Коментарі ({mainComments.length})
        </h3>
      )}

      {/* Поле для ввода коментария */}
      {user?.id && (
        <div style={{ marginBottom: '20px', position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: 'transparent', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '0 12px' }}>
          <input
            type="text"
            placeholder="Прокоментуй..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newComment.trim()) {
                handleSubmitComment();
              }
            }}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              padding: '12px 16px',
              color: '#CFCFCF',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSubmitComment}
            disabled={submitting || !newComment.trim()}
            style={{
              padding: '7px 14px',
              backgroundColor: 'transparent',
              border: '1px solid #3A3A3A',
              borderRadius: '6px',
              color: '#CFCFCF',
              fontSize: '13px',
              fontWeight: '500',
              cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: submitting || !newComment.trim() ? '0.5' : '1',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!submitting && newComment.trim()) {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = '#A259FF';
                btn.style.color = '#A259FF';
              }
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.borderColor = '#3A3A3A';
              btn.style.color = '#CFCFCF';
            }}
          >
            {submitting ? 'Надсилання...' : 'Надіслати'}
          </button>
        </div>
      )}

      {/* Кнопки сортировки */}
      {mainComments.length > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSortBy('recent')}
            style={{
              padding: '7px 14px',
              backgroundColor: 'transparent',
              border: '1px solid #3A3A3A',
              borderRadius: '6px',
              color: '#CFCFCF',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.borderColor = '#A259FF';
              btn.style.color = '#A259FF';
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.borderColor = '#3A3A3A';
              btn.style.color = '#CFCFCF';
            }}
          >
            Нові
          </button>
          <button
            onClick={() => setSortBy('popular')}
            style={{
              padding: '7px 14px',
              backgroundColor: 'transparent',
              border: '1px solid #3A3A3A',
              borderRadius: '6px',
              color: '#CFCFCF',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.borderColor = '#A259FF';
              btn.style.color = '#A259FF';
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.borderColor = '#3A3A3A';
              btn.style.color = '#CFCFCF';
            }}
          >
            Популярні
          </button>
        </div>
      )}

      {/* Список коментариев */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9A9A9A' }}>
            Завантаження коментарів...
          </div>
        ) : sortedComments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9A9A9A' }}>
            Коментарів ще немає. Будьте першим!
          </div>
        ) : (
          sortedComments.map((comment) => {
            const replies = getReplies(comment.id);
            const isExpanded = expandedReplies.has(comment.id);

            return (
              <div
                key={comment.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {/* User Icon */}
                <svg
                  style={{
                    width: '24px',
                    height: '24px',
                    color: '#9A9A9A',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>

                {/* Comment Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '4px',
                    }}
                  >
                    {comment.user_email?.split('@')[0] || 'Анонім'}
                  </p>
                  <p
                    style={{
                      color: '#CFCFCF',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      wordBreak: 'break-word',
                      marginBottom: '8px',
                    }}
                  >
                    {comment.content}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <button
                      onClick={() =>
                        handleLikeComment(comment.id, comment.user_liked || false)
                      }
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: comment.user_liked ? '#FF1B6D' : '#9A9A9A',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!comment.user_liked) {
                          (e.currentTarget as HTMLButtonElement).style.color = '#CFCFCF';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!comment.user_liked) {
                          (e.currentTarget as HTMLButtonElement).style.color = '#9A9A9A';
                        }
                      }}
                    >
                      <svg
                        style={{ width: '16px', height: '16px' }}
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

                    {user?.id && (
                      <button
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === comment.id ? null : comment.id
                          )
                        }
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#9A9A9A',
                          cursor: 'pointer',
                          padding: '0',
                          transition: 'color 0.2s',
                          fontSize: '12px',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#A259FF';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#9A9A9A';
                        }}
                      >
                        ↳ Відповісти
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingLeft: '12px',
                        borderLeft: '2px solid #A259FF',
                        display: 'flex',
                        gap: '8px',
                        flexDirection: 'column',
                      }}
                    >
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Напишіть відповідь..."
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #3A3A3A',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#CFCFCF',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && replyText.trim()) {
                            handleSubmitReply(comment.id);
                          }
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={submitting || !replyText.trim()}
                          style={{
                            padding: '7px 14px',
                            backgroundColor: 'transparent',
                            border: '1px solid #3A3A3A',
                            borderRadius: '6px',
                            color: '#CFCFCF',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: submitting || !replyText.trim() ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: submitting || !replyText.trim() ? '0.5' : '1',
                          }}
                          onMouseEnter={(e) => {
                            if (!submitting && replyText.trim()) {
                              const btn = e.currentTarget as HTMLButtonElement;
                              btn.style.borderColor = '#A259FF';
                              btn.style.color = '#A259FF';
                            }
                          }}
                          onMouseLeave={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.borderColor = '#3A3A3A';
                            btn.style.color = '#CFCFCF';
                          }}
                        >
                          Відправити
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          style={{
                            padding: '7px 14px',
                            backgroundColor: 'transparent',
                            border: '1px solid #3A3A3A',
                            borderRadius: '6px',
                            color: '#CFCFCF',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.borderColor = '#A259FF';
                            btn.style.color = '#A259FF';
                          }}
                          onMouseLeave={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.borderColor = '#3A3A3A';
                            btn.style.color = '#CFCFCF';
                          }}
                        >
                          Скасувати
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
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
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#9A9A9A',
                          cursor: 'pointer',
                          padding: '0',
                          fontSize: '12px',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#A259FF';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#9A9A9A';
                        }}
                      >
                        {isExpanded ? '▼' : '▶'} Відповідей: {replies.length}
                      </button>

                      {/* Replies List */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: '8px',
                            paddingLeft: '20px',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}
                        >
                          {replies.map((reply) => (
                            <div key={reply.id}>
                              <p
                                style={{
                                  color: '#FFFFFF',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  marginBottom: '4px',
                                }}
                              >
                                {reply.user_email?.split('@')[0] || 'Анонім'}
                              </p>
                              <p
                                style={{
                                  color: '#CFCFCF',
                                  fontSize: '12px',
                                  lineHeight: '1.4',
                                  wordBreak: 'break-word',
                                  marginBottom: '6px',
                                }}
                              >
                                {reply.content}
                              </p>
                              <button
                                onClick={() =>
                                  handleLikeComment(
                                    reply.id,
                                    reply.user_liked || false
                                  )
                                }
                                style={{
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: reply.user_liked
                                    ? '#FF1B6D'
                                    : '#9A9A9A',
                                  cursor: 'pointer',
                                  padding: '0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  if (!reply.user_liked) {
                                    (e.currentTarget as HTMLButtonElement).style.color = '#CFCFCF';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!reply.user_liked) {
                                    (e.currentTarget as HTMLButtonElement).style.color = '#9A9A9A';
                                  }
                                }}
                              >
                                <svg
                                  style={{ width: '12px', height: '12px' }}
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}