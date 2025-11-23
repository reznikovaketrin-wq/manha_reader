import { Manhwa, Chapter } from '@/types/manhwa';
import manhwaJsonData from './manhwa.json';
import { ManhwaDataJSON } from '@/types/manhwa-json';

const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_BASE_URL || 'https://your-bucket.r2.dev';

console.log('🔧 R2_BASE_URL:', R2_BASE_URL);

// Привести JSON до правильного типу
const manhwaJson = manhwaJsonData as ManhwaDataJSON;

// Функція для генерації шляхів до сторінок
function generatePageUrls(manhwaId: string, chapterId: string, pagesCount: number): string[] {
  const pages: string[] = [];
  for (let i = 1; i <= pagesCount; i++) {
    const pageNum = String(i).padStart(2, '0'); // 01, 02, 03...
    pages.push(`${R2_BASE_URL}/${manhwaId}/chapters/${chapterId}/${pageNum}.jpg`);
  }
  console.log(`📖 ${manhwaId}/${chapterId}: ${pagesCount} страниц - ${pages[0]}`);
  return pages;
}

// Конвертувати JSON дані в Manhwa об'єкти
export const manhwaData: Manhwa[] = manhwaJson.manhwa.map(m => {
  console.log(`📚 Загрузка: ${m.id} - ${m.title}`);
  return {
    id: m.id,
    title: m.title,
    alternativeTitles: [],
    description: m.description,
    coverImage: `${R2_BASE_URL}${m.coverImage}`,
    author: '',
    artist: '',
    genres: [],
    status: m.status as 'ongoing' | 'completed' | 'hiatus',
    rating: m.rating,
    totalViews: 0,
    updatedAt: new Date().toISOString().split('T')[0],
    chapters: m.chapters.map(ch => {
      const pages = generatePageUrls(m.id, ch.id, ch.pagesCount);
      return {
        id: ch.id,
        number: ch.number,
        title: `Розділ ${ch.number}`,
        pages: pages,
        publishedAt: new Date().toISOString().split('T')[0],
        views: 0,
      };
    }),
  };
});

console.log(`✅ Загружено манхвы: ${manhwaData.length}`);

export function getManhwaById(id: string): Manhwa | undefined {
  const result = manhwaData.find(manhwa => manhwa.id === id);
  console.log(`🔍 getManhwaById("${id}"):`, result ? `найдена - ${result.title}` : 'НЕ НАЙДЕНА');
  return result;
}

export function getChapterByIds(manhwaId: string, chapterId: string) {
  const manhwa = getManhwaById(manhwaId);
  if (!manhwa) {
    console.log(`❌ Манхва не найдена: ${manhwaId}`);
    return undefined;
  }
  const chapter = manhwa.chapters.find(ch => ch.id === chapterId);
  console.log(`🔍 getChapterByIds("${manhwaId}", "${chapterId}"):`, 
    chapter ? `найдена - Розділ ${chapter.number}, ${chapter.pages.length} сторінок` : 'НЕ НАЙДЕНА'
  );
  if (chapter) {
    console.log(`   Перша сторінка:`, chapter.pages[0]);
  }
  return chapter;
}