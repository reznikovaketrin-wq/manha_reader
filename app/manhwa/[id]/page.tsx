'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ManhwaRatingHeader } from '@/components/manhwa-comments-component';
import { ManhwaCommentsComponent } from '@/components/manhwa-comments-component';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  pagesCount: number;
  status: string;
  publishedAt: string;
}

interface Manhwa {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  bgImage: string;
  charImage: string;
  status: string;
  rating: number;
  tags: string[];
  chapters: Chapter[];
  scheduleDay?: {
    dayBig: string;
    dayLabel: string;
    note: string;
  };
}

export default function ManhwaPage() {
  const params = useParams();
  const id = params?.id as string;

  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [totalViews, setTotalViews] = useState(0);
  const [activeTab, setActiveTab] = useState<'chapters' | 'ratings'>('chapters');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [readChapters, setReadChapters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Завантажити манхву з API
  useEffect(() => {
    if (!id) return;

    const fetchManhwa = async () => {
      try {
        console.log(`📖 Завантаження манхви: ${id}`);
        const response = await fetch(`/api/public/${id}`);

        if (!response.ok) {
          throw new Error(`Помилка завантаження: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Манхва завантажена:`, data.title);
        setManhwa(data);
        setLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Невідома помилка';
        console.error(`❌ Помилка:`, errorMsg);
        setManhwa(null);
        setLoading(false);
      }
    };

    fetchManhwa();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted">Завантаження...</div>
      </div>
    );
  }

  if (!manhwa) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4">
        <div className="text-red-500 text-lg">❌ Помилка: Манхву не знайдено</div>
        <Link href="/" className="text-blue-500 hover:text-blue-400">
          ← На головну
        </Link>
      </div>
    );
  }

  const statusText =
    manhwa.status === 'ongoing'
      ? 'Онгоїнг'
      : manhwa.status === 'completed'
        ? 'Завершено'
        : 'На паузі';

  const filteredChapters = manhwa.chapters.filter((chapter) => {
    const query = searchQuery.toLowerCase();
    return (
      chapter.chapterNumber.toString().includes(query) ||
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
      <div className="w-full py-6 px-4 md:px-6">
        {/* Desktop: flex row, Mobile: flex col */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* Ліва панель - Обкладинка та кнопки */}
          <div className="w-full md:w-[250px] md:flex-shrink-0">
            {/* Обкладинка */}
            <div className="mb-4 rounded-lg overflow-hidden bg-card-bg">
              <div
                className="w-full aspect-[2/3] bg-cover bg-center"
                style={{ backgroundImage: `url(${manhwa.coverImage})` }}
              />
            </div>

            {/* Кнопка Читати */}
            <Link
              href={`/reader/${manhwa.id}/${
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

            {/* Підказка про збережену позицію */}
            {savedProgress && (
              <p className="text-xs text-text-muted mb-3 px-2 text-center">
                Продовжити з розділу{' '}
                {Math.ceil((savedProgress.page_number || savedProgress.pageNumber || 1) / 5)}
              </p>
            )}

            {/* Кнопка Додати в список */}
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
              Додати в список
            </button>
          </div>

          {/* Права частина - Основний контент */}
          <div className="flex-1 w-full">
            {/* Заголовок та мета-інформація */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-6 mb-3">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h1 className="text-2xl md:text-4xl font-extrabold text-text-main mb-2 leading-tight">
                        {manhwa.title}
                      </h1>
                      <p className="text-text-muted text-xs md:text-sm">
                        {new Date().getFullYear()} Манхва
                      </p>
                    </div>
                    {/* Рейтинг на мобільних - компактний */}
                    <div className="md:hidden flex-shrink-0">
                      <ManhwaRatingHeader manhwaId={id} />
                    </div>
                  </div>
                </div>
                {/* Рейтинг на десктопі - повний */}
                <div className="hidden md:block md:ml-auto">
                  <ManhwaRatingHeader manhwaId={id} />
                </div>
              </div>
            </div>

            {/* Опис */}
            <div className="mb-6 md:mb-8">
              <p
                className={`text-text-main leading-relaxed mb-2 text-sm md:text-base ${
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
                  {expandedDescription ? 'Сховати' : 'Розгорнути повністю'}
                </button>
              )}
            </div>

            {/* Метадані - Карусель на мобільних, сітка на десктопі */}
            <div className="mb-6 md:mb-8">
              {/* Мобільна версія - горизонтальна карусель */}
              <div className="md:hidden">
                <div className="bg-card-bg border border-text-muted/20 rounded-lg p-3 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 min-w-min">
                    {/* Статус тайтла */}
                    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-card-hover rounded-lg border border-text-muted/20">
                      <div className="w-5 h-5 rounded border border-text-muted/40 flex items-center justify-center flex-shrink-0">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                      </div>
                      <div className="whitespace-nowrap">
                        <p className="text-text-muted text-xs uppercase tracking-wide">
                          Статус
                        </p>
                        <p className="text-text-main font-semibold text-xs">{statusText}</p>
                      </div>
                    </div>

                    {/* Розділи */}
                    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-card-hover rounded-lg border border-text-muted/20">
                      <div className="w-5 h-5 rounded border border-text-muted/40 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-text-main"
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
                      <div className="whitespace-nowrap">
                        <p className="text-text-muted text-xs uppercase tracking-wide">Розділи</p>
                        <p className="text-text-main font-semibold text-xs">{manhwa.chapters.length}</p>
                      </div>
                    </div>

                    {/* Тип */}
                    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-card-hover rounded-lg border border-text-muted/20">
                      <div className="w-5 h-5 rounded border border-text-muted/40 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-text-main"
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
                      <div className="whitespace-nowrap">
                        <p className="text-text-muted text-xs uppercase tracking-wide">Тип</p>
                        <p className="text-text-main font-semibold text-xs">
                          {manhwa.tags && manhwa.tags.length > 0
                            ? manhwa.tags.slice(0, 1).join(', ')
                            : 'Не вказано'}
                        </p>
                      </div>
                    </div>

                    {/* Перегляди */}
                    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-card-hover rounded-lg border border-text-muted/20">
                      <div className="w-5 h-5 rounded border border-text-muted/40 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-text-main"
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
                      <div className="whitespace-nowrap">
                        <p className="text-text-muted text-xs uppercase tracking-wide">
                          Перегляди
                        </p>
                        <p className="text-text-main font-semibold text-xs">
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
              </div>

              {/* Десктопна версія - сітка */}
              <div className="hidden md:block bg-card-bg border border-text-muted/20 rounded-lg p-4">
                <div className="flex flex-wrap gap-6 text-sm">
                  {/* Статус тайтла */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-text-muted/40 flex items-center justify-center flex-shrink-0">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wide">
                        Статус тайтлу
                      </p>
                      <p className="text-text-main font-semibold">{statusText}</p>
                    </div>
                  </div>

                  {/* Розділи */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-text-muted/40 flex items-center justify-center flex-shrink-0">
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
                    <div className="w-6 h-6 rounded border border-text-muted/40 flex items-center justify-center flex-shrink-0">
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
                          : 'Не вказано'}
                      </p>
                    </div>
                  </div>

                  {/* Перегляди */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded border border-text-muted/40 flex items-center justify-center flex-shrink-0">
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
            </div>

            {/* Вкладки - адаптивні */}
            <div className="mb-6">
              <div className="flex gap-0 md:gap-4 border-b border-text-muted/20">
                <button
                  onClick={() => setActiveTab('chapters')}
                  className={`flex-1 md:flex-none py-3 px-3 md:px-4 font-medium text-xs md:text-sm transition-colors border-b-2 ${
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
                  <span className="hidden md:inline">Розділи</span>
                  <span className="md:hidden">Розділи</span>
                </button>
                <button
                  onClick={() => setActiveTab('ratings')}
                  className={`flex-1 md:flex-none py-3 px-3 md:px-4 font-medium text-xs md:text-sm transition-colors border-b-2 ${
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
                  <span className="hidden md:inline">Коментарі</span>
                  <span className="md:hidden">Коментарі</span>
                </button>
              </div>
            </div>

            {/* Вміст вкладок */}
            {activeTab === 'chapters' && (
              <div>
                {/* Поле пошуку */}
                <div className="mb-6 relative">
                  <input
                    type="text"
                    placeholder="Номер або назва розділу"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card-bg border border-text-muted/20 rounded-lg px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:border-blue-500 transition-colors text-sm md:text-base"
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

                {/* Список розділів */}
                <div className="space-y-1">
                  {filteredChapters.length > 0 ? (
                    filteredChapters.map((chapter) => {
                      const isRead = readChapters.has(chapter.id);
                      return (
                        <Link
                          key={chapter.id}
                          href={`/reader/${manhwa.id}/${chapter.id}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 bg-card-bg hover:bg-card-hover transition-colors duration-150 rounded-lg border border-transparent hover:border-blue-500/50">
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
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
                              <div className="min-w-0">
                                <p className="text-text-main font-medium text-sm md:text-base truncate">
                                  Том {Math.ceil(chapter.chapterNumber / 20)} Розділ {chapter.chapterNumber}
                                </p>
                              </div>
                            </div>
                            <p className="text-text-muted text-xs md:text-sm flex-shrink-0 ml-2">
                              {new Date(chapter.publishedAt).toLocaleDateString('uk-UA')}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-text-muted text-sm">Розділи не знайдені</div>
                  )}
                </div>

                {/* Кнопка показати спочатку */}
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
                {/* Компонент коментарів манхви */}
                <ManhwaCommentsComponent manhwaId={id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}