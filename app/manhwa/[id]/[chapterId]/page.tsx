'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getManhwaById, getChapterByIds } from '@/data/manhwa';
import { saveReadingProgress } from '@/lib/reading-history';
import { incrementViews } from '@/lib/views-tracker';
import { notFound } from 'next/navigation';

interface ReaderPageProps {
  params: {
    id: string;
    chapterId: string;
  };
}

export default function ReaderPage({ params }: ReaderPageProps) {
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastScrollY, setLastScrollY] = useState(0);

  const manhwa = getManhwaById(params.id);
  const chapter = getChapterByIds(params.id, params.chapterId);

  // Збільшити лічильник переглядів при завантаженні
  useEffect(() => {
    if (manhwa && chapter) {
      incrementViews(params.id, params.chapterId);
    }
  }, [params.id, params.chapterId, manhwa, chapter]);

  const currentChapterIndex = manhwa?.chapters.findIndex(ch => ch.id === params.chapterId) ?? -1;
  const prevChapter = currentChapterIndex > 0 ? manhwa?.chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < (manhwa?.chapters.length ?? 0) - 1 ? manhwa?.chapters[currentChapterIndex + 1] : null;

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      setScrollProgress(progress);

      // Розрахувати поточну сторінку на основі скролу
      if (chapter) {
        const pageHeight = documentHeight / chapter.pages.length;
        const page = Math.floor(scrolled / pageHeight) + 1;
        setCurrentPage(Math.min(page, chapter.pages.length));
      }

      // Автоматичний перехід на наступний розділ при досяганні кінця
      if (progress >= 95 && nextChapter) {
        router.push(`/manhwa/${params.id}/${nextChapter.id}`);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapter, nextChapter, params.id, router]);

  // Автоматичне збереження прогресу
  useEffect(() => {
    if (manhwa && chapter) {
      const saveProgress = () => {
        saveReadingProgress(params.id, params.chapterId, currentPage);
      };

      // Зберігати при зміні сторінки
      saveProgress();

      // Зберігати при виході зі сторінки
      return () => {
        saveProgress();
      };
    }
  }, [params.id, params.chapterId, currentPage, manhwa, chapter]);

  if (!manhwa || !chapter) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-900 z-50">
        <div 
          className="h-full bg-white transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Controls */}
      <div 
        className={`fixed top-1 left-0 right-0 z-40 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="max-w-[1000px] mx-auto px-4 py-4 flex items-center justify-between bg-black/80 backdrop-blur-sm mt-1">
          <Link 
            href={`/manhwa/${params.id}`}
            className="flex items-center gap-2 text-white hover:text-text-muted transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Назад</span>
          </Link>

          <div className="text-center">
            <h1 className="text-white font-medium">{manhwa.title}</h1>
            <p className="text-text-muted text-sm">
              Розділ {chapter.number}: {chapter.title}
            </p>
          </div>

          <button
            onClick={() => setShowControls(!showControls)}
            className="text-white hover:text-text-muted transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Pages - без разрывів та закруглень */}
      <div className="max-w-5xl w-full mx-auto pt-20 px-4 md:px-6 flex flex-col gap-0">
        {chapter.pages.map((page, index) => (
          <div key={index} className="w-full bg-black">
            <img
              src={page}
              alt={`Сторінка ${index + 1}`}
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="max-w-5xl w-full mx-auto px-4 py-8 bg-black">
        <div className="flex items-center justify-between gap-4">
          {/* Previous Chapter */}
          {prevChapter ? (
            <Link
              href={`/manhwa/${params.id}/${prevChapter.id}`}
              className="flex-1 p-4 bg-card-bg hover:bg-card-hover transition-colors text-left"
            >
              <p className="text-text-muted text-sm mb-1">← Попередній</p>
              <p className="font-medium">Розділ {prevChapter.number}: {prevChapter.title}</p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {/* Back to Chapters */}
          <Link
            href={`/manhwa/${params.id}`}
            className="px-6 py-4 bg-white text-black hover:bg-text-muted transition-colors font-medium"
          >
            Всі розділи
          </Link>

          {/* Next Chapter */}
          {nextChapter ? (
            <Link
              href={`/manhwa/${params.id}/${nextChapter.id}`}
              className="flex-1 p-4 bg-card-bg hover:bg-card-hover transition-colors text-right"
            >
              <p className="text-text-muted text-sm mb-1">Наступний →</p>
              <p className="font-medium">Розділ {nextChapter.number}: {nextChapter.title}</p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-text-muted text-sm">
          <p>Сторінка {currentPage} з {chapter.pages.length}</p>
          <p className="mt-2">Прогрес автоматично зберігається</p>
        </div>
      </div>

      {/* Floating Controls Toggle */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="fixed bottom-8 right-8 w-12 h-12 bg-white text-black shadow-lg hover:bg-text-muted transition-colors z-50 flex items-center justify-center"
      >
        {showControls ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
    </div>
  );
}