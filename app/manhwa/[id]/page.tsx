'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { getManhwaById } from '@/data/manhwa';
import { getChapterViews, getTotalManhwaViews } from '@/lib/views-tracker';
import Link from 'next/link';
import Image from 'next/image';

interface ManhwaPageProps {
  params: {
    id: string;
  };
}

export default function ManhwaPage({ params }: ManhwaPageProps) {
  const [totalViews, setTotalViews] = useState(0);
  const [chapterViews, setChapterViews] = useState<{ [key: string]: number }>({});

  const manhwa = getManhwaById(params.id);

  useEffect(() => {
    if (manhwa) {
      // Завантажити загальну кількість переглядів
      const total = getTotalManhwaViews(params.id);
      setTotalViews(total);

      // Завантажити перегляди для кожного розділу
      const views: { [key: string]: number } = {};
      manhwa.chapters.forEach(chapter => {
        views[chapter.id] = getChapterViews(params.id, chapter.id);
      });
      setChapterViews(views);
    }
  }, [params.id, manhwa]);

  if (!manhwa) {
    notFound();
  }

  const statusText = 
    manhwa.status === 'ongoing' ? 'ONGOING' : 
    manhwa.status === 'completed' ? 'ЗАВЕРШЕНО' : 
    'HIATUS';

  return (
    <div className="max-w-[1160px] mx-auto px-4 pb-10">
      {/* Hero Section з обкладинкою */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Обкладинка */}
          <div className="w-full md:w-[300px] flex-shrink-0">
            <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-card-bg">
              <div 
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${manhwa.coverImage})` }}
              />
            </div>
          </div>

          {/* Інформація */}
          <div className="flex-1">
            {/* Статус */}
            <div className="flex flex-wrap gap-4 mb-4">
              <span className="px-4 py-1.5 bg-card-hover rounded-full text-sm font-medium uppercase tracking-tight-2">
                {statusText}
              </span>
              <span className="px-4 py-1.5 bg-card-hover rounded-full text-sm font-medium uppercase tracking-tight-2">
                БЕЗ ЦЕНЗУРИ
              </span>
              <span className="px-4 py-1.5 bg-card-hover rounded-full text-sm font-medium uppercase tracking-tight-2">
                MANHWA
              </span>
            </div>

            {/* Заголовок */}
            <h1 className="text-5xl md:text-6xl font-extrabold uppercase tracking-tight-2 mb-4">
              {manhwa.title}
            </h1>


            {/* Метадані */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-text-muted text-sm mb-1">Рейтинг</p>
                <p className="font-medium">{manhwa.rating} / 10</p>
              </div>
              <div>
                <p className="text-text-muted text-sm mb-1">Переглядів</p>
                <p className="font-medium">{totalViews.toLocaleString('uk-UA')}</p>
              </div>
            </div>

        

            {/* Опис */}
            <div>
              <p className="text-text-muted text-sm mb-2">Опис</p>
              <p className="text-text-main leading-relaxed">
                {manhwa.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Розділи */}
      <div>
        <h2 className="text-3xl font-extrabold uppercase tracking-tight-2 mb-6">
          Розділи ({manhwa.chapters.length})
        </h2>

        <div className="space-y-2">
          {manhwa.chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/manhwa/${manhwa.id}/${chapter.id}`}
              className="block"
            >
              <div className="p-4 bg-card-bg hover:bg-card-hover transition-colors duration-150 rounded-lg border border-transparent hover:border-text-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-1">
                      Розділ {chapter.number}: {chapter.title}
                    </h3>
                    <p className="text-text-muted text-sm">
                      {new Date(chapter.publishedAt).toLocaleDateString('uk-UA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right text-text-muted text-sm">
                    <p>{(chapterViews[chapter.id] || 0).toLocaleString('uk-UA')} переглядів</p>
                    <p>{chapter.pages.length} сторінок</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Кнопка повернення */}
      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-card-hover hover:bg-text-muted/10 transition-colors duration-150 rounded-lg font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад до бібліотеки
        </Link>
      </div>
    </div>
  );
}
