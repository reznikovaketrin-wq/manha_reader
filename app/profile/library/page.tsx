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
import { hasNewChapters } from '@/lib/manhwa-visited';
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
        // Збагатити даними з manhwa.json
        const enrichedData = await Promise.all(
          result.data.map(async (item) => {
            const manhwa = await getManhwaById(item.manhwa_id);
            if (!manhwa) return item;

            // Знайти останню прочитану главу
            let lastReadChapterNumber: number | undefined;

            if (item.last_read_chapter) {
              const lastIdStr = String(item.last_read_chapter);

              // Спочатку шукаємо по ID, потім по номеру глави
              let chapter = manhwa.chapters.find((ch: any) => String(ch.id) === lastIdStr);
              if (!chapter) {
                const chapterNum = parseInt(lastIdStr, 10);
                if (!isNaN(chapterNum)) {
                  chapter = manhwa.chapters.find((ch: any) => ch.number === chapterNum);
                }
              }

              if (chapter) lastReadChapterNumber = chapter.number;
            }

            // Глави для плашки: publishedAt з fallback на createdAt
            const chapterDates = manhwa.chapters.map((ch: any) => ({
              publishedAt: ch.publishedAt ?? ch.createdAt ?? null,
              status: ch.status ?? 'published',
            }));

            console.log(`[Library] 🔎 ${item.manhwa_id}:`, {
              supabase_last_read_at: item.last_read_at ?? 'null',
              supabase_last_read_chapter: item.last_read_chapter ?? 'null',
              total_chapters: manhwa.chapters.length,
              lastReadChapterNumber,
              // Показати останню главу та чи має вона дату
              last_chapter_raw: manhwa.chapters.length > 0 ? {
                id: manhwa.chapters[manhwa.chapters.length - 1].id,
                number: manhwa.chapters[manhwa.chapters.length - 1].number,
                publishedAt: manhwa.chapters[manhwa.chapters.length - 1].publishedAt ?? 'undefined',
                mapped_publishedAt: chapterDates[chapterDates.length - 1]?.publishedAt ?? 'null',
              } : 'no chapters',
            });

            // Обчислюємо has_new_chapters ОДИН РАЗ при збагаченні даних,
            // а не при кожному рендері — читаємо localStorage тут
            const hasNew = hasNewChapters(item.manhwa_id, chapterDates, item.last_read_at);

            return {
              ...item,
              manhwa_title: manhwa.title,
              manhwa_cover: manhwa.coverImage,
              last_read_chapter_number: lastReadChapterNumber,
              total_chapters: manhwa.chapters.length,
              manhwa_chapters: chapterDates,
              has_new_chapters: hasNew,
            };
          })
        );

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
          {libraryData.map((item) => (
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
                  {/* Плашка "Оновлено" — обчислена заздалегідь, без зайвих викликів при рендері */}
                  {item.has_new_chapters && (
                    <div className={styles.newBadge}>Оновлено</div>
                  )}

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
          ))}
        </div>
      )}
    </div>
  );
}
