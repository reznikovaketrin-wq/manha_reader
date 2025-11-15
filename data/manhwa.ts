import { Manhwa, Chapter } from '@/types/manhwa';
import manhwaJsonData from './manhwa.json';
import { ManhwaDataJSON } from '@/types/manhwa-json';

const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || 'https://your-bucket.r2.dev';

// Привести JSON до правильного типу
const manhwaJson = manhwaJsonData as ManhwaDataJSON;

// Функція для генерації шляхів до сторінок
function generatePageUrls(manhwaId: string, chapterId: string, pagesCount: number): string[] {
  const pages: string[] = [];
  for (let i = 1; i <= pagesCount; i++) {
    const pageNum = String(i).padStart(2, '0'); // 01, 02, 03...
    pages.push(`${R2_BASE_URL}/${manhwaId}/chapters/${chapterId}/${pageNum}.jpg`);
  }
  return pages;
}

// Конвертувати JSON дані в Manhwa об'єкти
export const manhwaData: Manhwa[] = manhwaJson.manhwa.map(m => ({
  id: m.id,
  title: m.title,
  alternativeTitles: m.alternativeTitles,
  description: m.description,
  coverImage: `${R2_BASE_URL}${m.coverImage}`,
  author: m.author,
  artist: m.artist,
  genres: m.genres,
  status: m.status as 'ongoing' | 'completed' | 'hiatus', // Явне приведення типу
  rating: m.rating,
  totalViews: 0,
  updatedAt: m.updatedAt,
  chapters: m.chapters.map(ch => ({
    id: ch.id,
    number: ch.number,
    title: ch.title,
    pages: generatePageUrls(m.id, ch.id, ch.pagesCount),
    publishedAt: ch.publishedAt,
    views: 0,
  })),
}));

export function getManhwaById(id: string): Manhwa | undefined {
  return manhwaData.find(manhwa => manhwa.id === id);
}

export function getChapterByIds(manhwaId: string, chapterId: string) {
  const manhwa = getManhwaById(manhwaId);
  if (!manhwa) return undefined;
  return manhwa.chapters.find(chapter => chapter.id === chapterId);
}
