/**
 * 📁 app/profile/library/page.tsx
 * Сторінка бібліотеки користувача з манхвами
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/app/providers/UserProvider';
import { getUserLibrary, getLibraryStats } from '@/lib/library-actions';
import { getManhwaById } from '@/data/manhwa';
import {
  ManhwaLibraryStatus,
  MANHWA_STATUS_LABELS,
  UserManhwaListItemExtended,
} from '@/lib/library-types';
import styles from './library.module.css';

export default function LibraryPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  const [activeTab, setActiveTab] = useState<ManhwaLibraryStatus>('reading');
  const [libraryData, setLibraryData] = useState<UserManhwaListItemExtended[]>([]);
  const [stats, setStats] = useState<Record<ManhwaLibraryStatus, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Редірект якщо не авторизований
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Завантажити статистику
  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      const statsData = await getLibraryStats();
      setStats(statsData);
    };

    loadStats();
  }, [user]);

  // Завантажити дані бібліотеки для активної вкладки
  useEffect(() => {
    if (!user) return;

    const loadLibrary = async () => {
      setIsLoading(true);

      const result = await getUserLibrary(activeTab);

      if (result.success && result.data) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Library] Завантажено записів:', result.data.length);
        }
        
        // Збагатити даними з manhwa.json
        const enrichedData = await Promise.all(
          result.data.map(async (item) => {
            const manhwa = await getManhwaById(item.manhwa_id);
            if (!manhwa) {
              if (process.env.NODE_ENV !== 'production') {
                console.log('[Library] Манхва не знайдена:', item.manhwa_id);
              }
              return item;
            }

            // Логування структури глав
            if (process.env.NODE_ENV !== 'production') {
              console.log('[Library] Перші 3 глави манхви:', manhwa.chapters.slice(0, 3).map((ch: any) => ({
                id: ch.id,
                number: ch.number,
                title: ch.title
              })));
            }

            // Знайти останню прочитану главу
            let lastReadChapterNumber: number | undefined;
            if (process.env.NODE_ENV !== 'production') {
              console.log('[Library] Reading history для', item.manhwa_id, ':', {
                last_read_chapter: item.last_read_chapter,
                last_read_at: item.last_read_at
              });
            }
            
            if (item.last_read_chapter) {
              // Безопасно привести id к строке для сравнения
              const lastIdStr = String(item.last_read_chapter);

              // Сначала ищем по ID (как строке)
              let chapter = manhwa.chapters.find((ch: any) => String(ch.id) === lastIdStr);

              // Если не найдено по ID, пробуем по номеру главы
                if (!chapter) {
                const chapterNum = parseInt(lastIdStr, 10);
                if (!isNaN(chapterNum)) {
                  chapter = manhwa.chapters.find((ch: any) => ch.number === chapterNum);
                  if (process.env.NODE_ENV !== 'production') {
                    console.log('[Library] Шукаємо по номеру:', chapterNum, 'Знайдено:', !!chapter);
                  }
                }
              }

                if (chapter) {
                lastReadChapterNumber = chapter.number;
                if (process.env.NODE_ENV !== 'production') {
                  console.log('[Library] Знайдено главу:', chapter.number);
                }
              } else {
                if (process.env.NODE_ENV !== 'production') {
                  console.log('[Library] Глава не знайдена:', item.last_read_chapter);
                }
              }
            }

            return {
              ...item,
              manhwa_title: manhwa.title,
              manhwa_cover: manhwa.coverImage,
              last_read_chapter_number: lastReadChapterNumber,
              total_chapters: manhwa.chapters.length,
            };
          })
        );

        if (process.env.NODE_ENV !== 'production') {
          console.log('[Library] Збагачені дані:', enrichedData);
        }
        setLibraryData(enrichedData);
      }

      setIsLoading(false);
    };

    loadLibrary();
  }, [user, activeTab]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Завантаження...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Редірект вже в useEffect
  }

  const tabs: ManhwaLibraryStatus[] = [
    'reading',
    'planned',
    'completed',
    'rereading',
    'postponed',
    'dropped',
  ];

  return (
    <div className={styles.container}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h1 className={styles.title}>Обрані</h1>
        <p className={styles.subtitle}>
          Всього {stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0} тайтлів
        </p>
      </div>

      {/* Вкладки */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {MANHWA_STATUS_LABELS[tab]}
            {stats && stats[tab] > 0 && (
              <span className={styles.tabCount}>{stats[tab]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Контент */}
      {isLoading ? (
        <div className={styles.loading}>Завантаження...</div>
      ) : libraryData.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Тут поки що порожньо</p>
          <p className={styles.emptySubtext}>
            Додайте манхву до категорії "{MANHWA_STATUS_LABELS[activeTab]}"
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {libraryData.map((item) => {
            if (process.env.NODE_ENV !== 'production') {
              console.log('[Library RENDER] Картка:', {
                title: item.manhwa_title,
                last_read_chapter_number: item.last_read_chapter_number,
                hasChapter: !!item.last_read_chapter_number
              });
            }
            
            return (
              <Link
                key={item.id}
                href={`/manhwa/${item.manhwa_id}`}
                className={styles.card}
              >
                {/* Обкладинка */}
                <div
                  className={styles.cover}
                  style={{
                    backgroundImage: `url(${item.manhwa_cover || '/placeholder.png'})`,
                  }}
                >
                  {/* Статус */}
                  <div className={styles.statusBadge}>
                    {MANHWA_STATUS_LABELS[item.status]}
                  </div>

                  {/* Плашка останньої прочитаної глави */}
                  {item.last_read_chapter_number && (
                    <div className={styles.lastReadBadge}>
                      <svg className={styles.lastReadIcon} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      Розділ {item.last_read_chapter_number}
                    </div>
                  )}
                </div>

              {/* Інформація */}
              <div className={styles.info}>
                <h3 className={styles.cardTitle}>{item.manhwa_title || 'Без назви'}</h3>
                {item.total_chapters && (
                  <p className={styles.cardMeta}>
                    {item.total_chapters} розділ{item.total_chapters > 1 ? 'ів' : ''}
                  </p>
                )}
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
