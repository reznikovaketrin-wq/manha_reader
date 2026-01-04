'use client';

// Domain types - основные бизнес-типы
export type {
  Manhwa,
  ManhwaDetail,
  ManhwaStatus,
  ManhwaType,
  PublicationType,
} from './domain/Manhwa';

export type { Chapter } from './domain/chapter';

// API types - то что приходит с сервера
export type { ChapterAPI } from './api/chapter';

// UI types - для компонентов
export type { ChaptersListProps } from './ui/ChapterListItem';