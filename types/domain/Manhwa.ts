// types/domain/Manhwa.ts
'use client';

/**
 * Domain Types - Основные типы данных приложения
 * Это единый источник истины для всего приложения
 */

import type { Chapter } from './chapter';

export type ManhwaStatus = 'ongoing' | 'completed' | 'hiatus' | 'paused';
export type ManhwaType = 'manhwa' | 'manga' | 'manhua' | 'novel';
export type PublicationType = 'official' | 'fan' | 'uncensored' | 'censored';

/**
 * Manhwa - доменная модель манхвы
 * Отражает реальные данные из API (но уже преобразованные через mapper)
 * 
 * ✅ Все поля явные (не мутируем API-объект)
 * ✅ Правильные значения по умолчанию
 * ✅ Полная типизация
 */
export interface Manhwa {
  // Основные
  id: string;
  title: string;
  description: string; // default: ''
  
  // Изображения
  coverImage: string; // default: ''
  bgImage?: string;
  
  // Метаданные
  status: ManhwaStatus; // default: 'ongoing'
  type: ManhwaType; // default: 'manhwa'
  publicationType: PublicationType; // default: 'official'
  
  // Главы (отображаются в UI)
  chapters: Chapter[]; // default: []
  
  // Статистика
  rating: number; // default: 0
  ratingCount: number; // default: 0
  totalViews: number; // default: 0
  
  // Резервное поле
  [key: string]: any;
}

/**
 * ManhwaDetail - расширенная информация
 * Используется для страницы с деталями
 */
export interface ManhwaDetail extends Manhwa {
  author?: string;
  artist?: string;
  genres?: string[];
  likes?: number;
  comments?: number;
}