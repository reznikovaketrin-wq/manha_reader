'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import styles from './ChaptersList.module.css';
import { isChapterRead, ArchivedRange } from '@/lib/reading-progress';
import { useUser } from '@/app/providers/UserProvider';
import { useUserProfile } from '@/hooks/useUserProfile';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  pagesCount: number;
  status: string;
  publishedAt: string;
  vipOnly?: boolean;
  vipEarlyDays?: number;
  publicAvailableAt?: string | null;
}

interface ChaptersListProps {
  chapters: Chapter[];
  manhwaId: string;
  readChapters: Set<string>;
  archivedRanges?: ArchivedRange[];
  isMobile?: boolean;
}

/**
 * ChaptersList - единый компонент для desktop и mobile версий
 * Отображает список глав с поддержкой состояния "прочитано"
 */
const ChaptersList = memo(function ChaptersList({
  chapters,
  manhwaId,
  readChapters,
  archivedRanges = [],
  isMobile = false,
}: ChaptersListProps) {
  const { user } = useUser();
  const { profile } = useUserProfile();
  const resolvedRoleGlobal = profile?.role ?? (user as any)?.role;
  const [lockedChapter, setLockedChapter] = useState<Chapter | null>(null);

  // Проверка доступа к главе
  const checkChapterAccess = (chapter: Chapter): { hasAccess: boolean; reason?: string; availableDate?: Date } => {
    // DEBUG: Проверяем роль пользователя
    const resolvedRole = profile?.role ?? (user as any)?.role;
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Access check:', {
        chapterNumber: chapter.chapterNumber,
        userId: user?.id,
        userRole: resolvedRole,
        userEmail: user?.email,
        vipOnly: chapter.vipOnly,
        vipEarlyDays: chapter.vipEarlyDays,
      });
    }

    // Админы имеют доступ ко всему
    if (resolvedRole === 'admin') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Admin access granted');
      }
      return { hasAccess: true };
    }

    // VIP Only - только для VIP и админов
    if (chapter.vipOnly) {
      if (user?.role === 'vip' || user?.role === 'admin') {
        return { hasAccess: true };
      }
      return { 
        hasAccess: false, 
        reason: 'VIP тільки для преміум користувачів' 
      };
    }

    // Ранний доступ для VIP
    if (chapter.vipEarlyDays && chapter.vipEarlyDays > 0 && chapter.publicAvailableAt) {
      const now = new Date();
      const availableDate = new Date(chapter.publicAvailableAt);
      
      // VIP имеет доступ всегда
      if (user?.role === 'vip' || user?.role === 'admin') {
        return { hasAccess: true };
      }
      
      // Обычные пользователи ждут до publicAvailableAt
      if (now < availableDate) {
        return { 
          hasAccess: false, 
          reason: 'Ранній доступ для VIP',
          availableDate 
        };
      }
    }

    return { hasAccess: true };
  };

  if (!chapters || chapters.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: '#9A9A9A' }}>
        Розділи не знайдені
      </div>
    );
  }

  return (
    <>
      <div className={isMobile ? styles.containerMobile : styles.container}>
        {chapters.map((chapter) => {
          const isRead = isChapterRead(
            chapter.id, 
            chapter.chapterNumber, 
            readChapters, 
            archivedRanges
          );

          // Debug: Enhanced logging for read status
          if (chapter.chapterNumber <= 5 && process.env.NODE_ENV !== 'production') {
            const idStr = String(chapter.id);
            console.log(`[ChaptersList] Chapter ${chapter.chapterNumber} read status:`, {
              chapterId: chapter.id,
              chapterIdString: idStr,
              isRead,
              readChaptersSize: readChapters.size,
              readChaptersHasId: readChapters.has(idStr),
              readChaptersValues: Array.from(readChapters),
            });
          }

          const access = checkChapterAccess(chapter);
          const isLocked = !access.hasAccess;
          
          // DEBUG: Лог для перевірки VIP полів
          if (chapter.chapterNumber === 1 && process.env.NODE_ENV !== 'production') {
            console.log('🔍 Chapter 1 VIP data:', {
              vipOnly: chapter.vipOnly,
              vipEarlyDays: chapter.vipEarlyDays,
              publicAvailableAt: chapter.publicAvailableAt,
              hasAccess: access.hasAccess,
              userRole: resolvedRoleGlobal || 'guest',
            });
          }

          const handleClick = (e: React.MouseEvent) => {
            if (isLocked) {
              e.preventDefault();
              setLockedChapter(chapter);
            }
          };

          if (isMobile) {
            return (
              <div key={chapter.id}>
                <Link
                  href={isLocked ? '#' : `/reader/${manhwaId}/${chapter.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                  onClick={handleClick}
                >
                  <div className={`${styles.chapterItemMobile} ${isLocked ? styles.locked : ''}`}>
                    <div className={styles.chapterContentMobile}>
                      {isLocked ? (
                        <svg
                          style={{ width: '20px', height: '20px', color: '#FF6B6B', flexShrink: 0 }}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v3H9V6a3 3 0 0 1 3-3z"/>
                        </svg>
                      ) : isRead ? (
                        <svg
                          style={{ width: '20px', height: '20px', color: '#00C2C8', flexShrink: 0 }}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                    <svg
                      style={{ width: '20px', height: '20px', color: '#9A9A9A', flexShrink: 0 }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                  <div className={styles.chapterInfoMobile}>
                    <p className={styles.chapterTitleMobile}>
                      Розділ {chapter.chapterNumber}
                    </p>
                  </div>
                </div>
                <p className={styles.chapterDateMobile}>
                  {new Date(chapter.publishedAt).toLocaleDateString('uk-UA')}
                </p>
              </div>
            </Link>
              </div>
            );
          }

          return (
            <div key={chapter.id}>
              <Link
                href={isLocked ? '#' : `/reader/${manhwaId}/${chapter.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
                onClick={handleClick}
              >
                <div className={`${styles.chapterItem} ${isLocked ? styles.locked : ''}`}>
                  <div className={styles.chapterContent}>
                    {isLocked ? (
                      <svg
                        style={{ width: '20px', height: '20px', color: '#FF6B6B', flexShrink: 0 }}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v3H9V6a3 3 0 0 1 3-3z"/>
                      </svg>
                    ) : isRead ? (
                      <svg
                        style={{ width: '20px', height: '20px', color: '#00C2C8', flexShrink: 0 }}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                  <svg
                    style={{ width: '20px', height: '20px', color: '#9A9A9A', flexShrink: 0 }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                )}
                <div className={styles.chapterInfo}>
                  <p className={styles.chapterTitle}>
                    Том {Math.ceil(chapter.chapterNumber / 20)} Розділ {chapter.chapterNumber}
                  </p>
                </div>
              </div>
              <p className={styles.chapterDate}>
                {new Date(chapter.publishedAt).toLocaleDateString('uk-UA')}
              </p>
            </div>
          </Link>
            </div>
          );
        })}
      </div>

      {/* Модальное окно для заблокированной главы */}
      {lockedChapter && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setLockedChapter(null)}
        >
          <div 
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid #3A3A3A',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🔒</span>
              Розділ недоступний
            </h2>
            
            <p style={{ color: '#CFCFCF', marginBottom: '16px', lineHeight: '1.5' }}>
              Розділ {lockedChapter.chapterNumber}
              {lockedChapter.vipOnly 
                ? ' доступний тільки для VIP та преміум користувачів.' 
                : (() => {
                    const access = checkChapterAccess(lockedChapter);
                    if (access.availableDate) {
                      return ` буде доступний для всіх користувачів ${access.availableDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })} о ${access.availableDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}.`;
                    }
                    return ' недоступний.';
                  })()
              }
            </p>

            <div style={{ padding: '12px', backgroundColor: '#0A0A0A', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ color: '#A259FF', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                ⭐ Переваги VIP підписки:
              </p>
              <ul style={{ color: '#9A9A9A', fontSize: '13px', paddingLeft: '20px', margin: 0 }}>
                <li>Ранній доступ до нових розділів</li>
                <li>Ексклюзивний VIP контент</li>
                <li>Без реклами</li>
              </ul>
            </div>

            <button
              onClick={() => setLockedChapter(null)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#A259FF',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8E44E8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#A259FF'}
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default ChaptersList;