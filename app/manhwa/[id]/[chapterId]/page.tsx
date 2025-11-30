'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getManhwaById, getChapterByIds } from '@/data/manhwa';
import { saveReadingProgress, getHistoryForManhwa } from '@/lib/reading-history';
import { incrementViews } from '@/lib/views-tracker';
import { notFound } from 'next/navigation';
import { supabase, getLastReadChapter } from '@/lib/supabase';
import { ChapterCommentsComponent } from '@/components/chapter-comments';

interface ReaderPageProps {
  params: {
    id: string;
    chapterId: string;
  };
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [progressRestored, setProgressRestored] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(60);
  const [footerHeight, setFooterHeight] = useState(70);

  const manhwa = getManhwaById(params.id);
  const chapter = getChapterByIds(params.id, params.chapterId);

  // Определить текущие главы (выше всех useEffect для использования в зависимостях)
  const currentChapterIndex = manhwa?.chapters.findIndex(ch => ch.id === params.chapterId) ?? -1;
  const prevChapter = currentChapterIndex > 0 ? manhwa?.chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < (manhwa?.chapters.length ?? 0) - 1 ? manhwa?.chapters[currentChapterIndex + 1] : null;

  // Получить текущего пользователя
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
  }, []);

  // Отслеживание просмотров
  useEffect(() => {
    if (manhwa && chapter) {
      incrementViews(params.id, params.chapterId);

      const trackView = async () => {
        try {
          await fetch('/api/views/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manhwaId: params.id }),
          });
        } catch (error) {
          console.error('Error tracking view:', error);
        }
      };

      trackView();
    }
  }, [params.id, params.chapterId, manhwa, chapter]);

  // Сброс прогресса при смене главы
  useEffect(() => {
    setProgressRestored(false);
    window.scrollTo(0, 0);
  }, [params.chapterId]);

  // Восстановить прогресс при загрузке главы
  useEffect(() => {
    if (!chapter || !manhwa) return;

    const restoreProgress = async () => {
      try {
        if (user?.id) {
          const lastChapter = await getLastReadChapter(user.id, params.id);
          if (lastChapter && lastChapter.chapter_id === params.chapterId) {
            const pageNumber = lastChapter.page_number || 1;
            setCurrentPage(pageNumber);
            setProgressRestored(true);
            return;
          }
        }

        const history = getHistoryForManhwa(params.id);
        const currentChapterHistory = history.find(h => h.chapterId === params.chapterId);

        if (currentChapterHistory) {
          setCurrentPage(currentChapterHistory.pageNumber || 1);
        }

        setProgressRestored(true);
      } catch (error) {
        console.error('Error restoring progress:', error);
        setProgressRestored(true);
      }
    };

    const timeout = setTimeout(() => {
      restoreProgress();
    }, 300);

    return () => clearTimeout(timeout);
  }, [params.id, params.chapterId, chapter, user, manhwa]);

  // Сохранение прогресса
  useEffect(() => {
    if (manhwa && chapter && progressRestored) {
      const saveProgress = () => {
        saveReadingProgress(params.id, params.chapterId, currentPage);
      };

      saveProgress();

      return () => {
        saveProgress();
      };
    }
  }, [params.id, params.chapterId, currentPage, manhwa, chapter, progressRestored]);

  // Отслеживание размеров
  useEffect(() => {
    const updateHeights = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
      if (footerRef.current) {
        setFooterHeight(footerRef.current.offsetHeight);
      }
    };

    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, [showUI]);

  // Обработка скролла
  useEffect(() => {
    const handleScroll = () => {
      const contentElement = contentRef.current;
      if (!contentElement) return;

      const scrollTop = window.scrollY;
      const documentHeight = contentElement.offsetHeight;
      const windowHeight = window.innerHeight - headerHeight - footerHeight;
      const totalScrollable = documentHeight - windowHeight;

      // Прогресс скролла
      const progress = totalScrollable > 0 ? (scrollTop / totalScrollable) * 100 : 0;
      setScrollProgress(progress);

      // Вычисление текущей страницы на основе скролла
      if (chapter && chapter.pages.length > 0) {
        const pageHeight = documentHeight / chapter.pages.length;
        const page = Math.floor(scrollTop / pageHeight) + 1;
        setCurrentPage(Math.min(Math.max(page, 1), chapter.pages.length));
      }

      // Автоматический переход на следующую главу при достижении конца
      if (progress >= 95 && nextChapter) {
        router.push(`/manhwa/${params.id}/${nextChapter.id}`);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapter, params.id, nextChapter, headerHeight, footerHeight, router]);

  // Горячие клавиши
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUI(!showUI);
        setShowSettings(false);
        setShowChapterList(false);
        setShowComments(false);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        window.scrollBy({ top: -window.innerHeight / 2, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showUI]);

  // Автопрокрутка
  useEffect(() => {
    if (!autoScrolling) return;

    const interval = setInterval(() => {
      window.scrollBy({ top: 2, behavior: 'auto' });
    }, 300);

    return () => clearInterval(interval);
  }, [autoScrolling]);

  const goToNextChapter = () => {
    if (nextChapter) {
      router.push(`/manhwa/${params.id}/${nextChapter.id}`);
    }
  };

  const goToPrevChapter = () => {
    if (prevChapter) {
      router.push(`/manhwa/${params.id}/${prevChapter.id}`);
    }
  };

  const handleCenterClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    // Клик по центру - скрыть интерфейс
    if (clickX > rect.width * 0.25 && clickX < rect.width * 0.75) {
      setShowUI(!showUI);
      setShowSettings(false);
      setShowChapterList(false);
      setShowComments(false);
    }
  };

  if (!manhwa || !chapter) {
    notFound();
  }

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
      {/* Top Header */}
      <header
        ref={headerRef}
        className={`bg-black/90 backdrop-blur-sm border-b border-text-muted/20 transition-all duration-300 overflow-hidden flex-shrink-0 ${
          showUI ? 'h-auto' : 'h-0'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3">
          <Link
            href={`/manhwa/${params.id}`}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          <div className="flex-1 text-center min-w-0">
            <h1 className="text-xs md:text-sm font-semibold truncate">{manhwa.title}</h1>
            <div className="flex items-center justify-center gap-1 md:gap-2 mt-1">
              {prevChapter && (
                <button
                  onClick={goToPrevChapter}
                  className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                >
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <span className="text-xs text-gray-400 truncate">
                Том 2 Розділ {chapter.number}
              </span>
              {nextChapter && (
                <button
                  onClick={goToNextChapter}
                  className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                >
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area - скролл для страниц */}
      <div 
        className="flex-1 relative overflow-y-auto overflow-x-hidden bg-black" 
        style={{ filter: `brightness(${brightness}%)` }} 
        onClick={handleCenterClick}
        ref={contentRef}
      >
        {/* Left tap zone - переход к предыдущей главе */}
        <div
          className="fixed left-0 top-0 bottom-0 w-1/4 cursor-pointer group z-20 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevChapter();
          }}
          style={{
            top: headerHeight,
            bottom: footerHeight,
          }}
        >
          <div className="h-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
            <span className="text-white/0 group-hover:text-white/50 transition-colors text-xs md:text-sm">
              ← Глава
            </span>
          </div>
        </div>

        {/* Right tap zone - переход к следующей главе */}
        <div
          className="fixed right-0 top-0 bottom-0 w-1/4 cursor-pointer group z-20 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            goToNextChapter();
          }}
          style={{
            top: headerHeight,
            bottom: footerHeight,
          }}
        >
          <div className="h-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
            <span className="text-white/0 group-hover:text-white/50 transition-colors text-xs md:text-sm">
              Глава →
            </span>
          </div>
        </div>

        {/* Image container */}
        <div className="w-full">
          <img
            src={chapter.pages[0]}
            alt={`Розділ ${chapter.number}`}
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>
      </div>

      {/* Bottom Navigation Panel */}
      <div
        ref={footerRef}
        className={`bg-black/90 backdrop-blur-sm border-t border-text-muted/20 transition-all duration-300 overflow-hidden flex-shrink-0 ${
          showUI ? 'h-auto' : 'h-0'
        }`}
      >
        <div className="px-3 py-2 md:px-4 md:py-3">
          <div className="w-full h-1 bg-gray-800 rounded-full mb-2 md:mb-3">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-gray-400 flex-shrink-0">{currentPage}/{chapter.pages.length}</div>

            <div className="flex items-center gap-0.5 md:gap-1">
              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className="p-1.5 md:p-2 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Список глав"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 md:p-2 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Настройки"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button 
                onClick={() => setShowComments(!showComments)}
                className="p-1.5 md:p-2 hover:bg-gray-800 rounded transition-colors relative flex-shrink-0"
                title="Коментарии"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-2H5a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 2z" />
                </svg>
              </button>

              <button
                onClick={() => setAutoScrolling(!autoScrolling)}
                className={`p-1.5 md:p-2 rounded transition-colors flex-shrink-0 ${
                  autoScrolling ? 'bg-blue-600' : 'hover:bg-gray-800'
                }`}
                title="Автопрокрутка"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-0.5 md:gap-1">
              <button
                onClick={goToPrevChapter}
                disabled={!prevChapter}
                className="p-1.5 md:p-2 hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={goToNextChapter}
                disabled={!nextChapter}
                className="p-1.5 md:p-2 hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && showUI && (
        <div className="fixed right-0 z-40 bg-card-bg border-l border-text-muted/20 overflow-y-auto w-64 md:w-80"
          style={{
            top: headerHeight,
            bottom: footerHeight,
          }}
        >
          <div className="p-3 md:p-4 space-y-4">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium">Яркость</span>
                <span className="text-xs text-gray-400">{brightness}%</span>
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setBrightness(100)}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs md:text-sm transition-colors"
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Chapter List Panel */}
      {showChapterList && showUI && (
        <div className="fixed left-0 z-40 bg-card-bg border-r border-text-muted/20 overflow-y-auto w-64 md:w-80"
          style={{
            top: headerHeight,
            bottom: footerHeight,
          }}
        >
          <div className="p-3 md:p-4 space-y-2">
            <h3 className="text-xs md:text-sm font-semibold mb-4">Розділи</h3>
            {manhwa?.chapters.map((ch) => (
              <Link key={ch.id} href={`/manhwa/${params.id}/${ch.id}`}>
                <div
                  className={`p-2 md:p-3 rounded-lg transition-colors cursor-pointer text-xs md:text-sm ${
                    ch.id === params.chapterId
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <p className="font-medium truncate">
                    Розділ {ch.number}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ch.publishedAt).toLocaleDateString('uk-UA')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments Panel - Drawer */}
      <ChapterCommentsComponent
        manhwaId={params.id}
        chapterId={params.chapterId}
        mode="drawer"
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}