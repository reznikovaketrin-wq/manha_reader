'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  pagesCount: number;
  publishedAt: string;
}

interface Manhwa {
  id: string;
  title: string;
  chapters: Chapter[];
}

interface ChapterData {
  id: string;
  chapterNumber: number;
  title: string;
  pages: string[];
}

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  const manhwaId = params?.id as string;
  const chapterId = params?.chapterId as string;

  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [brightness, setBrightness] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('manhwa-brightness');
      return saved ? parseInt(saved) : 100;
    }
    return 100;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [loading, setLoading] = useState(true);
  const [nextChapterLoaded, setNextChapterLoaded] = useState(false);
  const [preloadMarkerVisible, setPreloadMarkerVisible] = useState(false);

  // Завантажити манхву
  useEffect(() => {
    if (!manhwaId) return;

    const fetchManhwa = async () => {
      try {
        console.log(`📖 Завантаження манхви: ${manhwaId}`);
        const response = await fetch(`/api/public/${manhwaId}`);

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
        setLoading(false);
      }
    };

    fetchManhwa();
  }, [manhwaId]);

  // Завантажити перший розділ
  useEffect(() => {
    if (!chapterId || chapters.length > 0) return;

    const fetchChapter = async () => {
      try {
        console.log(`📄 Завантаження розділу: ${chapterId}`);
        
        // Получаем сторінки з API
        const response = await fetch(`/api/public/${manhwaId}/chapters/${chapterId}`);
        
        if (!response.ok) {
          console.warn(`⚠️ API вернув ${response.status}, используем placeholder`);
          
          // Fallback: используем дані з манхви
          if (manhwa) {
            const chapter = manhwa.chapters.find((ch) => ch.id === chapterId);
            if (chapter) {
              const chapterData: ChapterData = {
                id: chapter.id,
                chapterNumber: chapter.chapterNumber,
                title: chapter.title,
                pages: [
                  `https://via.placeholder.com/400x600?text=Сторінка+не+завантажена`,
                ],
              };
              
              setChapters([chapterData]);
              console.log(`✅ Розділ завантажено (placeholder)`);
            }
          }
          return;
        }

        const data = await response.json();
        console.log(`✅ Сторінки отримані: ${data.pages.length}`);

        // Извлечь URL'ы из объектов страниц
        const pageUrls = (data.pages || []).map((p: any) => 
          typeof p === 'string' ? p : p.imageUrl
        );

        const chapterData: ChapterData = {
          id: data.id,
          chapterNumber: data.chapterNumber,
          title: data.title,
          pages: pageUrls,
        };

        setChapters([chapterData]);
        console.log(`✅ Розділ завантажено`);
      } catch (err) {
        console.error(`❌ Помилка при завантаженні розділу:`, err);
        
        // Fallback: показуємо помилку
        if (manhwa) {
          const chapter = manhwa.chapters.find((ch) => ch.id === chapterId);
          if (chapter) {
            const chapterData: ChapterData = {
              id: chapter.id,
              chapterNumber: chapter.chapterNumber,
              title: chapter.title,
              pages: [],
            };
            setChapters([chapterData]);
          }
        }
      }
    };

    fetchChapter();
  }, [chapterId, manhwa, chapters.length, manhwaId]);

  // Зберегти brightness в localStorage
  useEffect(() => {
    localStorage.setItem('manhwa-brightness', brightness.toString());
  }, [brightness]);

  // Отримання видимого розділу
  const getVisibleChapterIndex = () => {
    let pageCount = 0;
    for (let i = 0; i < chapters.length; i++) {
      const chapterPageCount = chapters[i].pages.length;
      if (currentPage <= pageCount + chapterPageCount) {
        return i;
      }
      pageCount += chapterPageCount;
    }
    return chapters.length > 0 ? chapters.length - 1 : -1;
  };

  const { visibleChapterIndex, nextChapter, prevChapter } = useMemo(() => {
    const visIdx = getVisibleChapterIndex();
    const visibleChapter = visIdx >= 0 && visIdx < chapters.length ? chapters[visIdx] : null;

    if (!visibleChapter || !manhwa) {
      return { visibleChapterIndex: visIdx, nextChapter: null, prevChapter: null };
    }

    const currentChapterIndexInManhwa = manhwa.chapters.findIndex(
      (ch) => ch.id === visibleChapter.id
    );

    const next =
      currentChapterIndexInManhwa >= 0 && currentChapterIndexInManhwa < manhwa.chapters.length - 1
        ? manhwa.chapters[currentChapterIndexInManhwa + 1]
        : null;

    const prev = currentChapterIndexInManhwa > 0 ? manhwa.chapters[currentChapterIndexInManhwa - 1] : null;

    return { visibleChapterIndex: visIdx, nextChapter: next, prevChapter: prev };
  }, [chapters, currentPage, manhwa]);

  // Предзагрузка наступного розділу
  useEffect(() => {
    if (preloadMarkerVisible && nextChapter && !nextChapterLoaded && manhwa) {
      console.log(`⚡ Предзагрузка розділу: ${nextChapter.chapterNumber}`);

      const chapter = nextChapter;
      
      // Получаем сторінки з API
      fetch(`/api/public/${manhwaId}/chapters/${chapter.id}`)
        .then(response => response.json())
        .then(data => {
          // Извлечь URL'ы из объектов страниц
          const pageUrls = (data.pages || []).map((p: any) => 
            typeof p === 'string' ? p : p.imageUrl
          );
          
          const chapterData: ChapterData = {
            id: data.id,
            chapterNumber: data.chapterNumber,
            title: data.title,
            pages: pageUrls,
          };

          setChapters((prev) => [...prev, chapterData]);
          setNextChapterLoaded(true);
          console.log(`✅ Предзагрузка завершена: ${pageUrls.length} сторінок`);
        })
        .catch(err => {
          console.error(`❌ Помилка при предзагрузці:`, err);
          // Не добавляем fallback - просто пропускаем
        });
    }
  }, [preloadMarkerVisible, nextChapter, nextChapterLoaded, manhwa, manhwaId]);

  // Обробка скролу з Intersection Observer
  useEffect(() => {
    if (!contentRef.current || chapters.length === 0) return;

    const contentContainer = contentRef.current;
    const totalPages = chapters.reduce((sum, ch) => sum + ch.pages.length, 0);

    const pageMarkers: HTMLDivElement[] = [];
    let pageCount = 0;

    chapters.forEach((ch) => {
      ch.pages.forEach((page, pageIdx) => {
        pageCount++;
        const marker = document.createElement('div');
        marker.setAttribute('data-page', pageCount.toString());
        marker.style.height = '1px';
        marker.style.pointerEvents = 'none';

        const images = contentContainer.querySelectorAll('img');
        if (images[pageCount - 1]) {
          const imgParent = images[pageCount - 1].parentElement;
          if (imgParent) {
            imgParent.insertBefore(marker, images[pageCount - 1]);
            pageMarkers.push(marker);
          }
        }
      });
    });

    // Маркер для предзагрузки (70%)
    const preloadPageIndex = Math.ceil((totalPages * 70) / 100);
    const preloadMarker = document.createElement('div');
    preloadMarker.setAttribute('data-preload', 'true');
    preloadMarker.style.height = '1px';
    preloadMarker.style.pointerEvents = 'none';

    const allImages = contentContainer.querySelectorAll('img');
    if (allImages[preloadPageIndex - 1]) {
      allImages[preloadPageIndex - 1].parentElement?.appendChild(preloadMarker);
    } else {
      contentContainer.appendChild(preloadMarker);
    }

    // Page Observer
    const pageObserver = new IntersectionObserver(
      (entries) => {
        const visiblePages = entries
          .filter((e) => e.isIntersecting && e.target.getAttribute('data-page'))
          .map((e) => parseInt(e.target.getAttribute('data-page') || '0'))
          .filter((p) => p > 0);

        if (visiblePages.length > 0) {
          const currentPageNum = Math.max(...visiblePages);
          setCurrentPage(currentPageNum);

          const progress = totalPages > 0 ? (currentPageNum / totalPages) * 100 : 0;
          setScrollProgress(Math.min(progress, 100));
        }
      },
      {
        root: contentContainer,
        rootMargin: '0px',
        threshold: [0, 0.5, 1],
      }
    );

    // Preload Observer
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setPreloadMarkerVisible(entry.isIntersecting);
        });
      },
      {
        root: contentContainer,
        rootMargin: '0px',
        threshold: 0,
      }
    );

    pageMarkers.forEach((marker) => {
      pageObserver.observe(marker);
    });

    preloadObserver.observe(preloadMarker);

    return () => {
      pageObserver.disconnect();
      preloadObserver.disconnect();
      pageMarkers.forEach((marker) => marker.remove());
      preloadMarker.remove();
    };
  }, [chapters]);

  // Гарячі клавіші
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUI(!showUI);
        setShowSettings(false);
        setShowChapterList(false);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        contentRef.current?.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        contentRef.current?.scrollBy({ top: -window.innerHeight / 2, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showUI]);

  // Автопрокрутка
  useEffect(() => {
    if (!autoScrolling || !contentRef.current) return;

    const interval = setInterval(() => {
      contentRef.current?.scrollBy({ top: 2, behavior: 'auto' });
    }, 300);

    return () => clearInterval(interval);
  }, [autoScrolling]);

  const goToNextPage = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
    }
  };

  const handleCenterClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    if (clickX > rect.width * 0.25 && clickX < rect.width * 0.75) {
      setShowUI(!showUI);
      setShowSettings(false);
      setShowChapterList(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white">Завантаження...</div>
      </div>
    );
  }

  if (!manhwa) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <div className="text-red-500 text-lg">❌ Помилка: Манхву не знайдено</div>
        <Link href="/" className="text-blue-500 hover:text-blue-400">
          ← На головну
        </Link>
      </div>
    );
  }

  const totalPages = chapters.reduce((sum, ch) => sum + ch.pages.length, 0);
  const currentChapter = chapters.length > 0 ? chapters[visibleChapterIndex] : null;

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden w-screen h-screen">
      {/* Топ навігація */}
      <header
        className={`fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-b border-gray-800 transition-all duration-300 z-30 overflow-hidden ${
          showUI ? 'h-12 md:h-14 pointer-events-auto' : 'h-0 -top-12 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-2 py-1 md:px-4 md:py-2 h-full w-full">
          <Link
            href={`/manhwa/${manhwaId}`}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          <div className="flex-1 text-center min-w-0 px-2">
            <h1 className="text-xs md:text-sm font-semibold truncate">{manhwa.title}</h1>
            {currentChapter && <p className="text-xs text-gray-400">Розділ {currentChapter.chapterNumber}</p>}
          </div>

          <button className="p-1 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Основна область */}
      <div
        className="flex-1 relative overflow-y-auto bg-black w-full"
        style={{
          filter: `brightness(${brightness}%)`,
          marginTop: showUI ? '3rem' : '0',
          marginBottom: showUI ? '4rem' : '0',
          transition: 'margin 300ms',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={handleCenterClick}
        ref={contentRef}
      >
        {/* Ліва зона натиску */}
        <div
          className={`fixed left-0 top-0 bottom-0 w-1/4 cursor-pointer group z-20 pointer-events-auto touch-none transition-opacity duration-300 ${
            showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            goToPrevPage();
          }}
        >
          <div className="h-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
            <span className="text-white/0 group-hover:text-white/50 transition-colors text-xs">← Вверх</span>
          </div>
        </div>

        {/* Права зона натиску */}
        <div
          className={`fixed right-0 top-0 bottom-0 w-1/4 cursor-pointer group z-20 pointer-events-auto touch-none transition-opacity duration-300 ${
            showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            goToNextPage();
          }}
        >
          <div className="h-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
            <span className="text-white/0 group-hover:text-white/50 transition-colors text-xs">Вниз →</span>
          </div>
        </div>

        {/* Вміст розділів */}
        <div className="w-full overflow-x-hidden">
          {chapters.map((ch, chapterIdx) => {
            console.log(`📄 Розділ ${ch.chapterNumber} має ${ch.pages.length} сторінок`);
            console.log(`  URLs:`, ch.pages.slice(0, 2));
            return (
              <div key={ch.id} className="w-full">
                {ch.pages.map((page, pageIdx) => (
                  <img
                    key={`${ch.id}-${pageIdx}`}
                    src={page}
                    alt={`Розділ ${ch.chapterNumber} - Сторінка ${pageIdx + 1}`}
                    className="w-full h-auto object-contain block"
                    loading="lazy"
                    draggable={false}
                    onLoad={() => console.log(`✅ Завантажена: ${page}`)}
                    onError={(e) => console.error(`❌ Помилка завантаження: ${page}`, e)}
                  />
                ))}
                {/* Розділювач між розділами */}
                {chapterIdx < chapters.length - 1 && (
                  <div className="w-full h-8 bg-gradient-to-b from-black to-black/50 flex items-center justify-center">
                    <span className="text-gray-600 text-sm">Розділ {chapters[chapterIdx + 1].chapterNumber}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Низ навігація */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 transition-all duration-300 z-30 overflow-hidden ${
          showUI ? 'h-16 md:h-14 pointer-events-auto' : 'h-0 pointer-events-none'
        }`}
        style={{ width: '100%' }}
      >
        <div className="px-2 py-1.5 md:px-4 md:py-2 h-full flex flex-col justify-center w-full overflow-x-hidden">
          <div className="w-full h-0.5 bg-gray-800 rounded-full mb-1.5">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${scrollProgress}%` }} />
          </div>

          <div className="flex items-center justify-between gap-1 w-full overflow-x-auto">
            <div className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
              {currentPage}/{totalPages}
            </div>

            <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Список розділів"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Параметри"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button
                onClick={() => setAutoScrolling(!autoScrolling)}
                className={`p-1 rounded transition-colors flex-shrink-0 ${autoScrolling ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                title="Автопрокрутка"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={goToPrevPage}
                className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Прокрутити вверх"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button onClick={goToNextPage} className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0" title="Прокрутити вниз">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Панель параметрів */}
      {showSettings && showUI && (
        <div
          className="fixed right-0 z-40 bg-gray-900 border-l border-gray-800 overflow-y-auto w-64 md:w-80 max-w-[80vw]"
          style={{
            top: showUI ? '3rem' : '0',
            bottom: showUI ? '4rem' : '0',
          }}
        >
          <div className="p-3 md:p-4 space-y-4">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-medium">Яскравість</span>
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
              Скинути
            </button>
          </div>
        </div>
      )}

      {/* Панель списку розділів */}
      {showChapterList && showUI && (
        <div
          className="fixed left-0 z-40 bg-gray-900 border-r border-gray-800 overflow-y-auto w-64 md:w-80 max-w-[80vw]"
          style={{
            top: showUI ? '3rem' : '0',
            bottom: showUI ? '4rem' : '0',
          }}
        >
          <div className="p-3 md:p-4 space-y-2">
            <h3 className="text-xs md:text-sm font-semibold mb-4">Розділи</h3>
            {manhwa.chapters.map((ch) => (
              <Link key={ch.id} href={`/reader/${manhwaId}/${ch.id}`}>
                <div
                  className={`p-2 md:p-3 rounded-lg transition-colors cursor-pointer text-xs md:text-sm ${
                    chapters.some((c) => c.id === ch.id)
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <p className="font-medium truncate">Розділ {ch.chapterNumber}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ch.publishedAt).toLocaleDateString('uk-UA')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}