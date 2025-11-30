'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { getManhwaById } from '@/data/manhwa';
import { getChapterViews } from '@/lib/views-tracker';
import { getRecentHistory } from '@/lib/reading-history';
import { ReadingHistory } from '@/types/manhwa';
import { supabase, getManhwaViewCount, getLastReadChapter } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { ManhwaRatingHeader } from '@/components/manhwa-comments-component';
import { ManhwaCommentsComponent } from '@/components/manhwa-comments-component';

interface ManhwaPageProps {
  params: {
    id: string;
  };
}

export default function ManhwaPage({ params }: ManhwaPageProps) {
  const [totalViews, setTotalViews] = useState(0);
  const [chapterViews, setChapterViews] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'chapters' | 'ratings'>('chapters');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [readChapters, setReadChapters] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const manhwa = getManhwaById(params.id);

  // Получить текущего пользователя
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user as any);
    };

    getUser();
  }, []);

  // Загрузить данные манхвы
  useEffect(() => {
    if (manhwa) {
      const loadData = async () => {
        try {
          // Отследить просмотр через API
          await fetch('/api/views/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manhwaId: params.id }),
          }).catch(error => console.error('Error tracking view:', error));

          // Получить просмотры из Supabase
          const views = await getManhwaViewCount(params.id);
          setTotalViews(views);

          // Загрузить просмотры глав из localStorage (пока)
          const chapterViewsData: { [key: string]: number } = {};
          manhwa.chapters.forEach(chapter => {
            chapterViewsData[chapter.id] = getChapterViews(params.id, chapter.id);
          });
          setChapterViews(chapterViewsData);

          // Загрузить прогресс чтения
          if (user?.id) {
            // Брать из Supabase если авторизован
            const lastChapter = await getLastReadChapter(user.id, params.id);
            if (lastChapter) {
              setSavedProgress(lastChapter);

              // Обновить прочитанные главы
              const readChapterIds = new Set<string>();
              const lastChapterObj = manhwa.chapters.find(
                ch => ch.id === lastChapter.chapter_id
              );
              if (lastChapterObj) {
                manhwa.chapters.forEach(chapter => {
                  if (chapter.number <= lastChapterObj.number) {
                    readChapterIds.add(chapter.id);
                  }
                });
              }
              setReadChapters(readChapterIds);
            }
          } else {
            // Брать из localStorage если не авторизован
            const history = getRecentHistory(100);
            const lastProgress = history.find(h => h.manhwaId === params.id);
            if (lastProgress) {
              setSavedProgress(lastProgress);
            }

            const lastChapter = history
              .filter(h => h.manhwaId === params.id)
              .sort((a, b) => {
                const chapterA = manhwa.chapters.find(ch => ch.id === a.chapterId);
                const chapterB = manhwa.chapters.find(ch => ch.id === b.chapterId);
                return (chapterB?.number || 0) - (chapterA?.number || 0);
              })[0];

            const readChapterIds = new Set<string>();
            if (lastChapter) {
              const lastChapterObj = manhwa.chapters.find(
                ch => ch.id === lastChapter.chapterId
              );
              if (lastChapterObj) {
                manhwa.chapters.forEach(chapter => {
                  if (chapter.number <= lastChapterObj.number) {
                    readChapterIds.add(chapter.id);
                  }
                });
              }
            }
            setReadChapters(readChapterIds);
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных:', error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [params.id, manhwa, user]);

  if (!manhwa) {
    notFound();
  }

  const statusText =
    manhwa.status === 'ongoing'
      ? 'Онгоинг'
      : manhwa.status === 'completed'
        ? 'Завершено'
        : 'На паузе';

  const filteredChapters = manhwa.chapters.filter(chapter => {
    const query = searchQuery.toLowerCase();
    return (
      chapter.number.toString().includes(query) ||
      chapter.title.toLowerCase().includes(query)
    );
  });

  const descriptionLines = manhwa.description.split('\n');
  const isLongDescription =
    descriptionLines.length > 3 || manhwa.description.length > 200;
  const displayDescription = expandedDescription
    ? manhwa.description
    : descriptionLines.slice(0, 2).join('\n');

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="w-full py-6 px-6">
        <div className="flex gap-8">
          {/* Левая панель - Обложка и кнопки */}
          <div className="w-[250px] flex-shrink-0">
            {/* Обложка */}
            <div className="mb-4 rounded-lg overflow-hidden bg-card-bg">
              <div
                className="w-full aspect-[2/3] bg-cover bg-center"
                style={{ backgroundImage: `url(${manhwa.coverImage})` }}
              />
            </div>

            {/* Кнопка Читать */}
            <Link
              href={`/manhwa/${params.id}/${
                savedProgress?.chapter_id || savedProgress?.chapterId || manhwa.chapters[0]?.id
              }`}
              className="block"
            >
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg mb-3 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {savedProgress ? 'Продовжити читання' : 'Читати'}
              </button>
            </Link>

            {/* Підказка про сохранену позицію */}
            {savedProgress && (
              <p className="text-xs text-text-muted mb-3 px-2 text-center">
                Продовжити з розділу{' '}
                {Math.ceil((savedProgress.page_number || savedProgress.pageNumber || 1) / 5)}
              </p>
            )}

            {/* Кнопка Добавить в список */}
            <button className="w-full py-2 bg-card-bg hover:bg-card-hover text-text-main font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-text-muted/20">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Добавить в список
            </button>
          </div>

          {/* Правая часть - Основной контент */}
          <div className="flex-1">
            {/* Заголовок и мета-информация */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-6 mb-3">
                <div className="flex-1">
                  <h1 className="text-4xl font-extrabold text-text-main mb-2 leading-tight">
                    {manhwa.title}
                  </h1>
                  <p className="text-text-muted text-sm mb-4">
                    {new Date().getFullYear()} Манхва
                  </p>
                </div>
                <ManhwaRatingHeader manhwaId={params.id} />
              </div>
            </div>

            {/* Описание */}
            <div className="mb-8">
              <p
                className={`text-text-main leading-relaxed mb-2 ${
                  !expandedDescription && isLongDescription ? 'line-clamp-3' : ''
                }`}
              >
                {displayDescription}
              </p>
              {isLongDescription && (
                <button
                  onClick={() => setExpandedDescription(!expandedDescription)}
                  className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors"
                >
                  {expandedDescription ? 'Скрити' : 'Розгорнути повністю'}
                </button>
              )}
            </div>

            {/* Метаданные - Компактная плашечка */}
            <div className="mb-8 bg-card-bg border border-text-muted/20 rounded-lg p-4">
              <div className="flex flex-wrap gap-6 text-sm">
                {/* Статус тайтла */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded border border-text-muted/40 flex items-center justify-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide">
                      Статус тайтла
                    </p>
                    <p className="text-text-main font-semibold">{statusText}</p>
                  </div>
                </div>

                {/* Главы */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded border border-text-muted/40 flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-text-main"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide">Розділи</p>
                    <p className="text-text-main font-semibold">{manhwa.chapters.length}</p>
                  </div>
                </div>

                {/* Тип */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded border border-text-muted/40 flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-text-main"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide">Тип</p>
                    <p className="text-text-main font-semibold">
                      {manhwa.tags && manhwa.tags.length > 0
                        ? manhwa.tags.slice(0, 2).join(', ')
                        : 'Не вказан'}
                    </p>
                  </div>
                </div>

                {/* Просмотры */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded border border-text-muted/40 flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 text-text-main"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wide">
                      Перегляди
                    </p>
                    <p className="text-text-main font-semibold">
                      {totalViews > 1000000
                        ? (totalViews / 1000000).toFixed(1) + 'M'
                        : totalViews > 1000
                          ? (totalViews / 1000).toFixed(1) + 'K'
                          : totalViews}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Вкладки */}
            <div className="mb-6">
              <div className="flex gap-4 border-b border-text-muted/20">
                <button
                  onClick={() => setActiveTab('chapters')}
                  className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === 'chapters'
                      ? 'text-text-main border-blue-500'
                      : 'text-text-muted border-transparent hover:text-text-main'
                  }`}
                >
                  <svg
                    className="w-4 h-4 inline mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  Розділи
                </button>
                <button
                  onClick={() => setActiveTab('ratings')}
                  className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === 'ratings'
                      ? 'text-text-main border-blue-500'
                      : 'text-text-muted border-transparent hover:text-text-main'
                  }`}
                >
                  <svg
                    className="w-4 h-4 inline mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                  Коментарі
                </button>
              </div>
            </div>

            {/* Содержимое вкладок */}
            {activeTab === 'chapters' && (
              <div>
                {/* Поисковое поле */}
                <div className="mb-6 relative">
                  <input
                    type="text"
                    placeholder="Номер або назва розділу"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card-bg border border-text-muted/20 rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <svg
                    className="w-5 h-5 text-text-muted absolute right-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Список глав */}
                <div className="space-y-1">
                  {filteredChapters.length > 0 ? (
                    filteredChapters.map((chapter) => {
                      const isRead = readChapters.has(chapter.id);
                      return (
                        <Link
                          key={chapter.id}
                          href={`/manhwa/${manhwa.id}/${chapter.id}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between px-4 py-3 bg-card-bg hover:bg-card-hover transition-colors duration-150 rounded-lg border border-transparent hover:border-blue-500/50">
                            <div className="flex items-center gap-3 flex-1">
                              {isRead ? (
                                <svg
                                  className="w-4 h-4 text-green-400 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4 text-text-muted flex-shrink-0"
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
                              <div>
                                <p className="text-text-main font-medium">
                                  Том {Math.ceil(chapter.number / 20)} Розділ {chapter.number}
                                </p>
                              </div>
                            </div>
                            <p className="text-text-muted text-sm">
                              {new Date(chapter.publishedAt).toLocaleDateString('uk-UA')}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-text-muted">Розділи не знайдені</div>
                  )}
                </div>

                {/* Кнопка показать первые */}
                <div className="mt-6 text-right">
                  <button className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors flex items-center gap-1 ml-auto">
                    Показати спочатку
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 11l5-5m0 0l5 5m-5-5v12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'ratings' && (
              <div>
                {/* Компонент комментариев к манхве */}
                <ManhwaCommentsComponent manhwaId={params.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}