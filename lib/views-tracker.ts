interface ViewsData {
  [manhwaId: string]: {
    [chapterId: string]: number;
  };
}

const VIEWS_STORAGE_KEY = 'manhwa-views';

// Отримати всі дані переглядів
export function getAllViews(): ViewsData {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(VIEWS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Збільшити лічильник переглядів для розділу
export function incrementViews(manhwaId: string, chapterId: string): number {
  if (typeof window === 'undefined') return 0;

  try {
    const allViews = getAllViews();
    
    if (!allViews[manhwaId]) {
      allViews[manhwaId] = {};
    }
    
    if (!allViews[manhwaId][chapterId]) {
      allViews[manhwaId][chapterId] = 0;
    }
    
    allViews[manhwaId][chapterId] += 1;
    
    localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(allViews));
    
    return allViews[manhwaId][chapterId];
  } catch (error) {
    console.error('Failed to increment views:', error);
    return 0;
  }
}

// Отримати кількість переглядів для розділу
export function getChapterViews(manhwaId: string, chapterId: string): number {
  const allViews = getAllViews();
  return allViews[manhwaId]?.[chapterId] || 0;
}

// Отримати загальну кількість переглядів для манхви
export function getTotalManhwaViews(manhwaId: string): number {
  const allViews = getAllViews();
  const manhwaViews = allViews[manhwaId];
  
  if (!manhwaViews) return 0;
  
  return Object.values(manhwaViews).reduce((sum, views) => sum + views, 0);
}

// Отримати найпопулярніші розділи
export function getMostViewedChapters(limit: number = 10): Array<{
  manhwaId: string;
  chapterId: string;
  views: number;
}> {
  const allViews = getAllViews();
  const chapters: Array<{
    manhwaId: string;
    chapterId: string;
    views: number;
  }> = [];
  
  Object.entries(allViews).forEach(([manhwaId, manhwaData]) => {
    Object.entries(manhwaData).forEach(([chapterId, views]) => {
      chapters.push({ manhwaId, chapterId, views });
    });
  });
  
  return chapters
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

// Очистити всі дані переглядів
export function clearAllViews(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(VIEWS_STORAGE_KEY);
}
