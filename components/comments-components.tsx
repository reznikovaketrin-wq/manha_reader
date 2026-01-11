'use client';

import { ReactNode, useCallback, useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { EnrichedComment } from '../lib/comments.utils';

// ============================================
// CommentForm - Форма для добавления комментариев
// ============================================

interface CommentFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder?: string;
  variant?: 'large' | 'small';
}

export function CommentForm({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Напишіть коментар...',
  variant = 'large',
}: CommentFormProps) {
  const rows = variant === 'large' ? 3 : 2;
  const isSmall = variant === 'small';

  return (
    <div className={isSmall ? 'flex items-center gap-2' : 'mb-6 pb-6 border-b border-text-muted/20'}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${isSmall ? 'flex-1' : 'w-full'} bg-black border border-text-muted/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none ${
          isSmall ? 'text-sm' : ''
        }`}
        rows={rows}
      />
      <div className={isSmall ? 'flex items-center gap-2' : 'flex justify-end mt-3'}>
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className={`inline-flex items-center justify-center gap-2 min-w-[64px] px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-semibold ${
            isSmall ? 'text-sm px-4 py-1' : ''
          }`}
          type="button"
        >
          Надіслати
        </button>
      </div>
    </div>
  );
}

// ============================================
// CommentItem - Отдельный комментарий
// ============================================

interface CommentItemProps {
  comment: EnrichedComment;
  onReplyClick?: () => void;
  onLikeClick?: () => void;
  onDeleteClick?: () => void;
  isReplyFormOpen?: boolean;
  replyFormContent?: ReactNode;
}

export function CommentItem({
  comment,
  onReplyClick,
  onLikeClick,
  onDeleteClick,
  isReplyFormOpen,
  replyFormContent,
}: CommentItemProps) {
  const { profile, isAdmin } = useUserProfile();
  const [showMenu, setShowMenu] = useState(false);
  
  const resolvedUser = (comment as any).users;
  const userEmail = (comment as any).user_email;
  const userId = (comment as any).user_id;
  const displayName = (comment as any).display_name;

  const userName = displayName
    ? displayName
    : resolvedUser && resolvedUser.username
      ? resolvedUser.username
      : userEmail
        ? userEmail.split('@')[0]
        : userId
          ? `user_${String(userId).slice(0,6)}`
          : 'Анонім';

  // Small debug to ensure rendered name is resolved correctly
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧾 [CommentItem] userName:', userName, 'resolvedUser:', resolvedUser, 'user_email:', userEmail, 'user_id:', userId);
  }
  const date = new Date(comment.created_at).toLocaleDateString('uk-UA');
  
  // ✅ Может ли удалить комментарий? (только админ)
  const canDelete = isAdmin;

  return (
    <div className="border-l-2 border-blue-500 pl-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">{userName}</p>
          <p className="text-xs text-gray-400">{date}</p>
        </div>
        
        {/* ✅ МЕНЮ (удаление) */}
        {canDelete && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-card-hover rounded text-text-muted hover:text-text-main transition-colors"
              title="Опції"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="absolute right-0 top-8 bg-card-bg border border-text-muted/20 rounded-lg shadow-xl z-50 min-w-[140px]">
                  <button
                    onClick={() => {
                      onDeleteClick?.();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 text-sm flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Видалити
                  </button>
                </div>

                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-gray-300 text-sm mb-3">{comment.content}</p>

      <div className="flex gap-3 text-xs">
        {onReplyClick && (
          <button
            onClick={onReplyClick}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            ↳ Відповісти
          </button>
        )}

        {onLikeClick && (
          <button
            onClick={onLikeClick}
            className="text-gray-400 hover:text-gray-300 font-medium flex items-center gap-1"
          >
            ♥ {comment.likes_count || 0}
          </button>
        )}
      </div>

      {isReplyFormOpen && replyFormContent && (
        <div className="mt-4 pl-4 border-l-2 border-blue-400">{replyFormContent}</div>
      )}
    </div>
  );
}

// ============================================
// RepliesSection - Секция с ответами
// ============================================

interface RepliesSectionProps {
  replies: EnrichedComment[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReplyLike?: (replyId: string) => void;
  onReplyDelete?: (replyId: string) => void;
}

export function RepliesSection({
  replies,
  isExpanded,
  onToggleExpand,
  onReplyLike,
  onReplyDelete,
}: RepliesSectionProps) {
  const { profile, isAdmin } = useUserProfile();

  if (replies.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={onToggleExpand}
        className="text-xs text-gray-400 hover:text-gray-300 font-medium"
      >
        {isExpanded ? '▼' : '▶'} Відповідей: {replies.length}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-400">
          {replies.map((reply) => {
            const canDeleteReply = isAdmin;
            const [showReplyMenu, setShowReplyMenu] = useState(false);

            return (
              <div key={reply.id} className="border-l-2 border-green-500 pl-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-xs">
                      {(reply as any).users?.username || reply.user_email?.split('@')[0] || 'Анонім'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(reply.created_at).toLocaleDateString('uk-UA')}
                    </p>
                  </div>

                  {/* ✅ МЕНЮ REPLY */}
                  {canDeleteReply && (
                    <div className="relative">
                      <button
                        onClick={() => setShowReplyMenu(!showReplyMenu)}
                        className="p-1 hover:bg-card-hover rounded text-text-muted hover:text-text-main transition-colors"
                        title="Опції"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>

                      {showReplyMenu && (
                        <>
                          <div className="absolute right-0 top-6 bg-card-bg border border-text-muted/20 rounded-lg shadow-xl z-50 min-w-[140px]">
                            <button
                              onClick={() => {
                                onReplyDelete?.(reply.id);
                                setShowReplyMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 text-sm flex items-center gap-2 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Видалити
                            </button>
                          </div>

                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowReplyMenu(false)}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-gray-300 text-sm mb-2">{reply.content}</p>

                {onReplyLike && (
                  <button
                    onClick={() => onReplyLike(reply.id)}
                    className="text-xs text-gray-400 hover:text-gray-300 font-medium flex items-center gap-1"
                  >
                    ♥ {reply.likes_count || 0}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// LoadingState - Состояние загрузки
// ============================================

export function LoadingState({ text = 'Завантаження...' }: { text?: string }) {
  return <div className="text-gray-400 text-center py-8">{text}</div>;
}

// ============================================
// EmptyState - Пустое состояние
// ============================================

export function EmptyState({
  text = 'Коментарів ще немає. Будьте першим!',
}: {
  text?: string;
}) {
  return <div className="text-gray-400 text-center py-8">{text}</div>;
}

// ============================================
// CancelButton - Кнопка отмены
// ============================================

interface CancelButtonProps {
  onClick: () => void;
  className?: string;
}

export function CancelButton({ onClick, className }: CancelButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1 bg-card-bg hover:bg-card-hover border border-text-muted/20 rounded text-sm font-semibold transition-colors ${
        className || ''
      }`}
    >
      Скасувати
    </button>
  );
}