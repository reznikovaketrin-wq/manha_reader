'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [progressRestored, setProgressRestored] = useState(false);
  const [brightness, setBrightness] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('manhwa-brightness');
      return saved ? parseInt(saved) : 100;
    }
    return 100;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState(params.chapterId);
  const [nextChapterLoaded, setNextChapterLoaded] = useState(false);
  const [preloadMarkerVisible, setPreloadMarkerVisible] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [autoAdvance, setAutoAdvance] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('manhwa-autoAdvance');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [isChapterReady, setIsChapterReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // ← Флаг блокировки переходов

  const manhwa = getManhwaById(params.id);
  const chapter = getChapterByIds(params.id, currentChapterId);

  // Определить какая глава видна на экране по currentPage
  const getVisibleChapterIndexInBuffer = () => {
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

  // Вычислять nextChapter используя useMemo чтобы он пересчитывался при изменении chapters
  const { visibleChapterIndex, nextChapter, prevChapter } = useMemo(() => {
    const visIdx = getVisibleChapterIndexInBuffer();
    
    // Определяем текущую главу по visibleChapterIndex в буфере
    const visibleChapterInBuffer = visIdx >= 0 && visIdx < chapters.length ? chapters[visIdx] : null;
    
    if (!visibleChapterInBuffer || !manhwa) {
      console.log('📊 [MEMO] nextChapter calculated - no visible chapter or manhwa');
      return { visibleChapterIndex: visIdx, nextChapter: null, prevChapter: null };
    }
    
    // Ищем текущую главу в манхве
    const currentChapterIndexInManhwa = manhwa.chapters.findIndex(ch => ch.id === visibleChapterInBuffer.id);
    
    // Следующая глава это следующая в манхве!
    const next = currentChapterIndexInManhwa >= 0 && currentChapterIndexInManhwa < manhwa.chapters.length - 1
      ? manhwa.chapters[currentChapterIndexInManhwa + 1]
      : null;
    
    const prev = currentChapterIndexInManhwa > 0
      ? manhwa.chapters[currentChapterIndexInManhwa - 1]
      : null;
    
    console.log('📊 [MEMO] nextChapter calculated');
    console.log('  visibleChapterIndex:', visIdx);
    console.log('  visibleChapter:', visibleChapterInBuffer.number);
    console.log('  chapters.length:', chapters.length);
    console.log('  nextChapter:', next?.number);
    
    return { visibleChapterIndex: visIdx, nextChapter: next, prevChapter: prev };
  }, [chapters, currentPage, manhwa]);

  // Сбросить флаги когда меняется видимая глава
  useEffect(() => {
    console.log('📖 [VISIBLE] Visible chapter changed');
    console.log('  Visible chapter index:', visibleChapterIndex);
    console.log('  Next chapter:', nextChapter?.number);
    setNextChapterLoaded(false);
    setPreloadMarkerVisible(false);
  }, [visibleChapterIndex]);

  // Отследить изменение preloadMarkerVisible
  useEffect(() => {
    console.log('📌 [PRELOAD-MARKER] Visibility changed:', preloadMarkerVisible);
  }, [preloadMarkerVisible]);

  // Логика предзагрузки - срабатывает когда preloadMarker видна и есть nextChapter
  useEffect(() => {
    console.log('📊 [PRELOAD-EFFECT] Effect triggered');
    console.log('  preloadMarkerVisible:', preloadMarkerVisible);
    console.log('  nextChapter:', nextChapter?.number);
    console.log('  nextChapterLoaded:', nextChapterLoaded);
    console.log('  chapters.length:', chapters.length);
    
    if (preloadMarkerVisible && nextChapter && !nextChapterLoaded) {
      console.log('═══════════════════════════════════════════════════');
      console.log('⚡ [PRELOAD] Starting to preload next chapter at 70%');
      console.log('  Visible Chapter Index:', visibleChapterIndex);
      console.log('  Next Chapter ID:', nextChapter.id);
      console.log('  Next Chapter Number:', nextChapter.number);
      console.log('═══════════════════════════════════════════════════');
      
      const nextChapterData = getChapterByIds(params.id, nextChapter.id);
      if (nextChapterData) {
        console.log('✓ [PRELOAD] Chapter preloaded successfully');
        console.log('  Pages in next chapter:', nextChapterData.pages.length);
        setChapters(prev => {
          const newChapters = [...prev, nextChapterData];
          console.log('✓ [PRELOAD] Chapters buffer updated. Total chapters in buffer:', newChapters.length);
          return newChapters;
        });
        setNextChapterLoaded(true);
      } else {
        console.error('❌ [PRELOAD] Failed to load next chapter data');
      }
    } else {
      if (!preloadMarkerVisible) console.log('  ❌ preloadMarkerVisible is false');
      if (!nextChapter) console.log('  ❌ nextChapter is null');
      if (nextChapterLoaded) console.log('  ❌ nextChapterLoaded is true (already loaded)');
    }
  }, [preloadMarkerVisible, nextChapter, nextChapterLoaded, chapters.length, visibleChapterIndex]);

  useEffect(() => {
    if (chapter && chapters.length === 0) {
      console.log('═══════════════════════════════════════════════════');
      console.log('📦 [INIT] First chapter loaded');
      console.log('  Chapter ID:', chapter.id);
      console.log('  Chapter Number:', chapter.number);
      console.log('  Pages Count:', chapter.pages.length);
      console.log('  Total Pages:', chapter.pages.reduce((s, c) => s + 1, 0));
      console.log('═══════════════════════════════════════════════════');
      setChapters([chapter]);
      setNextChapterLoaded(false);
      setScrollProgress(0);
      setIsChapterReady(false);
      
      const timer = setTimeout(() => {
        console.log('✓ [INIT] Chapter ready after 500ms, autoscroll now available');
        setIsChapterReady(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [chapter]);

  // Получить текущего пользователя
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
  }, []);

  // Сохранить brightness в localStorage
  useEffect(() => {
    localStorage.setItem('manhwa-brightness', brightness.toString());
    console.log('💾 [SETTINGS] Brightness saved to localStorage:', brightness + '%');
  }, [brightness]);

  // Сохранить autoAdvance в localStorage
  useEffect(() => {
    localStorage.setItem('manhwa-autoAdvance', JSON.stringify(autoAdvance));
    console.log('💾 [SETTINGS] Auto-advance saved to localStorage:', autoAdvance ? 'ON' : 'OFF');
  }, [autoAdvance]);

  // Отслеживание просмотров
  useEffect(() => {
    if (manhwa && chapter) {
      incrementViews(params.id, currentChapterId);

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
  }, [params.id, currentChapterId, manhwa, chapter]);

  // ❌ УДАЛЕНО: Сброс прогресса при смене главы
  // currentChapterId больше не меняется при скролле!
  // Прогресс считается по всему буферу глав

  // Восстановить прогресс при загрузке главы
  useEffect(() => {
    if (!chapter || !manhwa) return;

    const restoreProgress = async () => {
      try {
        if (user?.id) {
          const lastChapter = await getLastReadChapter(user.id, params.id);
          if (lastChapter && lastChapter.chapter_id === currentChapterId) {
            const pageNumber = lastChapter.page_number || 1;
            console.log('📍 [RESTORE] Restored progress from Supabase');
            console.log('  Page:', pageNumber, '/', chapter.pages.length);
            setCurrentPage(pageNumber);
            setProgressRestored(true);
            return;
          }
        }

        const history = getHistoryForManhwa(params.id);
        const currentChapterHistory = history.find(h => h.chapterId === currentChapterId);

        if (currentChapterHistory) {
          console.log('📍 [RESTORE] Restored progress from localStorage');
          console.log('  Page:', currentChapterHistory.pageNumber, '/', chapter.pages.length);
          setCurrentPage(currentChapterHistory.pageNumber || 1);
        } else {
          console.log('📍 [RESTORE] No saved progress, starting from page 1');
        }

        setProgressRestored(true);
      } catch (error) {
        console.error('❌ [RESTORE] Error restoring progress:', error);
        setProgressRestored(true);
      }
    };

    const timeout = setTimeout(() => {
      restoreProgress();
    }, 300);

    return () => clearTimeout(timeout);
  }, [params.id, currentChapterId, chapter, user, manhwa]);

  // Сохранение прогресса
  useEffect(() => {
    if (manhwa && chapter && progressRestored) {
      const saveProgress = () => {
        saveReadingProgress(params.id, currentChapterId, currentPage);
        console.log('💾 [SAVE] Progress saved');
        console.log('  Manhwa:', manhwa.title);
        console.log('  Chapter:', currentChapterId);
        console.log('  Page:', currentPage, '/', chapter.pages.length);
      };

      saveProgress();

      return () => {
        saveProgress();
      };
    }
  }, [params.id, currentChapterId, currentPage, manhwa, chapter, progressRestored]);

  // Обработка скролла с Intersection Observer - подгрузка при 70% и отслеживание главы
  useEffect(() => {
    if (!contentRef.current || chapters.length === 0) return;

    const contentContainer = contentRef.current;
    const totalPages = chapters.reduce((sum, ch) => sum + ch.pages.length, 0);

    console.log('═══════════════════════════════════════════════════');
    console.log('🔧 [SETUP] Setting up Intersection Observers');
    console.log('  Chapters in buffer:', chapters.length);
    chapters.forEach((ch, idx) => {
      console.log(`    [${idx + 1}] Chapter ${ch.number} (${ch.pages.length} pages)`);
    });
    console.log('  Total pages:', totalPages);
    console.log('═══════════════════════════════════════════════════');

    // Создаем маркеры для каждой страницы (для отслеживания прогресса)
    const pageMarkers: HTMLDivElement[] = [];
    let pageCount = 0;

    chapters.forEach((ch, chapterIdx) => {
      ch.pages.forEach((page: string, pageIdx: number) => {
        pageCount++;
        const marker = document.createElement('div');
        marker.setAttribute('data-page', pageCount.toString());
        marker.style.height = '1px';
        marker.style.pointerEvents = 'none';
        
        const images = contentContainer.querySelectorAll('img');
        if (images[pageCount - 1]) {
          const imgParent = images[pageCount - 1].parentElement;
          if (imgParent && !imgParent.querySelector(`[data-page="${pageCount}"]`)) {
            imgParent.insertBefore(marker, images[pageCount - 1]);
            pageMarkers.push(marker);
          }
        }
      });
    });

    // Маркер для предзагрузки следующей главы (при 70%)
    // Размещаем на 70% от всех страниц в буфере
    const preloadPageIndex = Math.ceil((totalPages * 70) / 100);
    const preloadMarker = document.createElement('div');
    preloadMarker.setAttribute('data-preload', 'true');
    preloadMarker.style.height = '1px';
    preloadMarker.style.pointerEvents = 'none';
    
    const allImages = contentContainer.querySelectorAll('img');
    if (allImages[preloadPageIndex - 1]) {
      allImages[preloadPageIndex - 1].parentElement?.appendChild(preloadMarker);
      console.log(`📍 [PRELOAD-MARKER] Created at page ${preloadPageIndex}/${totalPages} (70%)`);
    } else {
      contentContainer.appendChild(preloadMarker);
      console.log(`📍 [PRELOAD-MARKER] Created at end of container`);
    }

    // Intersection Observer для отслеживания текущей страницы и главы
    const observerOptions = {
      root: contentContainer,
      rootMargin: '0px',
      threshold: [0, 0.5, 1],
    };

    const pageObserver = new IntersectionObserver((entries) => {
      // Отслеживаем текущую страницу
      const visiblePages = entries
        .filter(e => e.isIntersecting && e.target.getAttribute('data-page'))
        .map(e => parseInt(e.target.getAttribute('data-page') || '0'))
        .filter(p => p > 0);

      if (visiblePages.length > 0) {
        const currentPageNum = Math.max(...visiblePages);
        setCurrentPage(currentPageNum);

        // Рассчитываем прогресс по ВСЕм главам в буфере
        const progress = totalPages > 0 ? (currentPageNum / totalPages) * 100 : 0;
        setScrollProgress(Math.min(progress, 100));
        
        // Логирование только каждые 5%
        if (Math.round(progress) % 5 === 0) {
          console.log(`📄 Progress: ${Math.round(progress)}% (Page ${currentPageNum}/${totalPages})`);
        }
      }

      // ❌ УДАЛЕНО: Отслеживание смены главы (больше не нужно!)
      // currentChapterId остается неизменным на протяжении всего буфера
    }, observerOptions);

    // Observer для предзагрузки (70% прогресса)
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        console.log('🔍 [PRELOAD-OBSERVER] Callback fired');
        console.log('  Entries count:', entries.length);
        
        entries.forEach((entry) => {
          console.log(`  Entry isIntersecting: ${entry.isIntersecting}`);
          
          // Просто устанавливаем флаг видимости маркера
          if (entry.isIntersecting) {
            setPreloadMarkerVisible(true);
          } else {
            setPreloadMarkerVisible(false);
          }
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

    console.log(`✓ [SETUP] Page markers set up (${pageMarkers.length} markers)`);

    preloadObserver.observe(preloadMarker);
    console.log('✓ [SETUP] Preload observer set up');
    console.log('═══════════════════════════════════════════════════');

    return () => {
      console.log('🧹 [CLEANUP] Disconnecting all observers');
      pageObserver.disconnect();
      preloadObserver.disconnect();
      pageMarkers.forEach(marker => marker.remove());
      preloadMarker.remove();
      console.log('✓ [CLEANUP] All observers disconnected');
    };
  }, [chapters, params.id, nextChapter, nextChapterLoaded]);

  // Логирование состояния при изменении (для отладки)
  useEffect(() => {
    const state = {
      'Manhwa': manhwa?.title || 'Loading...',
      'Current Chapter': currentChapterId,
      'Current Page': currentPage,
      'Progress': Math.round(scrollProgress) + '%',
      'Chapters in Buffer': chapters.length,
      'Is Ready': isChapterReady,
      'UI Visible': showUI,
    };
    
    // Логирование в таблице каждые 2 секунды
    const logInterval = setInterval(() => {
      console.table(state);
    }, 5000);
    
    return () => clearInterval(logInterval);
  }, [manhwa, currentChapterId, currentPage, scrollProgress, chapters.length, isChapterReady, showUI]);

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

  // ⚠️ ОТКЛЮЧЕНО: Автопереход больше не нужен - используется бесконечный скролл
  // При достижении 70% прогресса следующая глава предзагружается и добавляется в буфер
  // Пользователь просто скролит дальше, видит разделитель и продолжает читать новую главу

  const goToNextChapter = () => {
    // Вместо перехода - скроллим вниз на высоту экрана
    if (contentRef.current) {
      contentRef.current.scrollBy({ 
        top: window.innerHeight, 
        behavior: 'smooth' 
      });
    }
  };

  const goToPrevChapter = () => {
    // Вместо перехода - скроллим вверх на высоту экрана
    if (contentRef.current) {
      contentRef.current.scrollBy({ 
        top: -window.innerHeight, 
        behavior: 'smooth' 
      });
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
      setShowComments(false);
    }
  };

  if (!manhwa || !chapter) {
    notFound();
  }

  const totalPages = chapters.reduce((sum, ch) => sum + ch.pages.length, 0);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden w-screen h-screen">
      {/* Top Header - Fixed */}
      <header
        className={`fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-b border-text-muted/20 transition-all duration-300 z-30 overflow-hidden ${
          showUI ? 'h-12 md:h-14 pointer-events-auto' : 'h-0 -top-12 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-2 py-1 md:px-4 md:py-2 h-full w-full">
          <Link
            href={`/manhwa/${params.id}`}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          <div className="flex-1 text-center min-w-0 px-2">
            <h1 className="text-xs md:text-sm font-semibold truncate">{manhwa.title}</h1>
            <p className="text-xs text-gray-400">Розділ {chapter.number}</p>
          </div>

          <button className="p-1 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
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
        {/* Left tap zone */}
        <div
          className={`fixed left-0 top-0 bottom-0 w-1/4 cursor-pointer group z-20 pointer-events-auto touch-none transition-opacity duration-300 ${
            showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            goToPrevChapter();
          }}
        >
          <div className="h-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
            <span className="text-white/0 group-hover:text-white/50 transition-colors text-xs">← Глава</span>
          </div>
        </div>

        {/* Right tap zone */}
        <div
          className={`fixed right-0 top-0 bottom-0 w-1/4 cursor-pointer group z-20 pointer-events-auto touch-none transition-opacity duration-300 ${
            showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            goToNextChapter();
          }}
        >
          <div className="h-full flex items-center justify-center group-hover:bg-white/5 transition-colors">
            <span className="text-white/0 group-hover:text-white/50 transition-colors text-xs">Глава →</span>
          </div>
        </div>

        {/* All chapters content */}
        <div className="w-full overflow-x-hidden">
          {chapters.map((ch, chapterIdx) => (
            <div key={ch.id} className="w-full">
              {ch.pages.map((page: string, pageIdx: number) => (
                <img
                  key={`${ch.id}-${pageIdx}`}
                  src={page}
                  alt={`Розділ ${ch.number} - Сторінка ${pageIdx + 1}`}
                  className="w-full h-auto object-contain block"
                  loading="lazy"
                  draggable={false}
                />
              ))}
              {/* Разделитель между главами */}
              {chapterIdx < chapters.length - 1 && (
                <div className="w-full h-8 bg-gradient-to-b from-black to-black/50 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">Розділ {chapters[chapterIdx + 1].number}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation Panel - Fixed */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-text-muted/20 transition-all duration-300 z-30 overflow-hidden ${
          showUI ? 'h-16 md:h-14 pointer-events-auto' : 'h-0 pointer-events-none'
        }`}
        style={{
          width: '100%',
        }}
      >
        <div className="px-2 py-1.5 md:px-4 md:py-2 h-full flex flex-col justify-center w-full overflow-x-hidden">
          <div className="w-full h-0.5 bg-gray-800 rounded-full mb-1.5">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-1 w-full overflow-x-auto">
            <div className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{currentPage}/{totalPages}</div>

            <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Список глав"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Настройки"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button 
                onClick={() => setShowComments(!showComments)}
                className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Коментарии"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-2H5a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 2z" />
                </svg>
              </button>

              <button
                onClick={() => setAutoScrolling(!autoScrolling)}
                className={`p-1 rounded transition-colors flex-shrink-0 ${
                  autoScrolling ? 'bg-blue-600' : 'hover:bg-gray-800'
                }`}
                title="Автопрокрутка"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={goToPrevChapter}
                className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Скролл вверх"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={goToNextChapter}
                className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                title="Скролл вниз"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && showUI && (
        <div className="fixed right-0 z-40 bg-card-bg border-l border-text-muted/20 overflow-y-auto w-64 md:w-80 max-w-[80vw]"
          style={{
            top: showUI ? '3rem' : '0',
            bottom: showUI ? '4rem' : '0',
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

            <div className="border-t border-text-muted/20 pt-4">
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs md:text-sm font-medium">Автопереход</span>
                <button
                  onClick={() => setAutoAdvance(!autoAdvance)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    autoAdvance
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {autoAdvance ? '✓ ВКЛ' : 'ВЫКЛ'}
                </button>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                {autoAdvance
                  ? 'Переход на следующую главу в конце'
                  : 'Вручную переходите между главами'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chapter List Panel */}
      {showChapterList && showUI && (
        <div className="fixed left-0 z-40 bg-card-bg border-r border-text-muted/20 overflow-y-auto w-64 md:w-80 max-w-[80vw]"
          style={{
            top: showUI ? '3rem' : '0',
            bottom: showUI ? '4rem' : '0',
          }}
        >
          <div className="p-3 md:p-4 space-y-2">
            <h3 className="text-xs md:text-sm font-semibold mb-4">Розділи</h3>
            {manhwa?.chapters.map((ch) => (
              <Link key={ch.id} href={`/manhwa/${params.id}/${ch.id}`}>
                <div
                  className={`p-2 md:p-3 rounded-lg transition-colors cursor-pointer text-xs md:text-sm ${
                    ch.id === currentChapterId
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
        chapterId={currentChapterId}
        mode="drawer"
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}