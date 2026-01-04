// hooks/useChaptersFilter.ts
'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Chapter } from '@/types/domain/chapter';

interface UseChaptersFilterReturn {
  filteredChapters: Chapter[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: 'asc' | 'desc' | null;
  setSortOrder: (order: 'asc' | 'desc' | null) => void;
}

/**
 * useChaptersFilter - управляет фильтрацией и сортировкой глав
 * Отделена от UI логики
 * 
 * ✅ Правильный импорт типов из domain
 */
export function useChaptersFilter(chapters: Chapter[]): UseChaptersFilterReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  const filteredChapters = useMemo(() => {
    let result = [...chapters];

    // Фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((chapter) =>
        chapter.number.toString().includes(query) ||
        (chapter.title && chapter.title.toLowerCase().includes(query))
      );
    }

    // Сортировка
    if (sortOrder) {
      result.sort((a, b) =>
        sortOrder === 'asc'
          ? a.number - b.number
          : b.number - a.number
      );
    }

    return result;
  }, [chapters, searchQuery, sortOrder]);

  return {
    filteredChapters,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
  };
}