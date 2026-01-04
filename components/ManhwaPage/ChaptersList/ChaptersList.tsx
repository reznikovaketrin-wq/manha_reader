'use client';

import { memo } from 'react';
import Link from 'next/link';
import styles from './ChaptersList.module.css';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  pagesCount: number;
  status: string;
  publishedAt: string;
}

interface ChaptersListProps {
  chapters: Chapter[];
  manhwaId: string;
  readChapters: Set<string>;
  isMobile?: boolean;
}

/**
 * ChaptersList - единый компонент для desktop и mobile версий
 * Отображает список глав с поддержкой состояния "прочитано"
 */
export const ChaptersList = memo(function ChaptersList({
  chapters,
  manhwaId,
  readChapters,
  isMobile = false,
}: ChaptersListProps) {
  if (!chapters || chapters.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: '#9A9A9A' }}>
        Розділи не знайдені
      </div>
    );
  }

  return (
    <div className={isMobile ? styles.containerMobile : styles.container}>
      {chapters.map((chapter) => {
        const isRead = readChapters.has(chapter.id);

        if (isMobile) {
          return (
            <Link
              key={chapter.id}
              href={`/reader/${manhwaId}/${chapter.id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className={styles.chapterItemMobile}>
                <div className={styles.chapterContentMobile}>
                  {isRead ? (
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
          );
        }

        return (
          <Link
            key={chapter.id}
            href={`/reader/${manhwaId}/${chapter.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div className={styles.chapterItem}>
              <div className={styles.chapterContent}>
                {isRead ? (
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
        );
      })}
    </div>
  );
});