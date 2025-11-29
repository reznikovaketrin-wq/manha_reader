// Типи для JSON структури
export interface ChapterJSON {
  id: string;
  number: number;
  pagesCount: number;
}

export interface ScheduleDayJSON {
  dayBig: string;
  dayLabel: string;
  note: string;
}

export interface ManhwaJSON {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  chapters: ChapterJSON[];
  scheduleDay?: ScheduleDayJSON; // Опциональное поле для расписания
  tags?: string[]; // Опциональное поле для тегов (БЕЗ ЦЕНЗУРИ, МАНХВА, и т.д.)
}

export interface ManhwaDataJSON {
  manhwa: ManhwaJSON[];
}