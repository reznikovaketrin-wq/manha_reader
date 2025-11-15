// Типи для JSON структури
export interface ChapterJSON {
  id: string;
  number: number;
  title: string;
  pagesCount: number;  // Замість масиву pages - просто кількість
  publishedAt: string;
}

export interface ManhwaJSON {
  id: string;
  title: string;
  alternativeTitles: string[];
  description: string;
  coverImage: string;  // Відносний шлях (без R2_BASE_URL)
  author: string;
  artist: string;
  genres: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  updatedAt: string;
  chapters: ChapterJSON[];
}

export interface ManhwaDataJSON {
  manhwa: ManhwaJSON[];
}
