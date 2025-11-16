// Типи для JSON структури
export interface ChapterJSON {
  id: string;
  number: number;
  pagesCount: number;
}

export interface ManhwaJSON {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  chapters: ChapterJSON[];
}

export interface ManhwaDataJSON {
  manhwa: ManhwaJSON[];
}