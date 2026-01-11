'use client';

/**
 * API Types - то что приходит с сервера / API
 * Это реальная структура данных из базы данных
 */

export interface ChapterAPI {
  id: string;
  chapterNumber: number;
  pagesCount: number;
  title?: string;
  status?: string;
  publishedAt?: string;
  vipOnly?: boolean;
  vipEarlyDays?: number;
  publicAvailableAt?: string | null;
  [key: string]: any;
}