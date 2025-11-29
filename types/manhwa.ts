export interface Chapter {
  id: string;
  number: number;
  title: string;
  pages: string[]; // URLs to images in R2
  publishedAt: string;
  views: number;
}

export interface ScheduleDay {
  dayBig: string;
  dayLabel: string;
  note: string;
}

export interface Manhwa {
  id: string;
  title: string;
  description: string;
  coverImage: string; // URL to cover image in R2
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  totalViews: number;
  chapters: Chapter[];
  updatedAt: string;
  scheduleDay?: ScheduleDay; // Опциональное поле для расписания
  tags?: string[]; // Опциональное поле для тегов (БЕЗ ЦЕНЗУРИ, МАНХВА, и т.д.)
}

export interface ReadingHistory {
  manhwaId: string;
  chapterId: string;
  pageNumber: number;
  timestamp: string;
}