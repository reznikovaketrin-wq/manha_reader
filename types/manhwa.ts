export interface Chapter {
  id: string;
  number: number;
  title: string;
  pages: string[]; // URLs to images in R2
  publishedAt: string;
  views: number;
}

export interface Manhwa {
  id: string;
  title: string;
  alternativeTitles: string[];
  description: string;
  coverImage: string; // URL to cover image in R2
  author: string;
  artist: string;
  genres: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  totalViews: number;
  chapters: Chapter[];
  updatedAt: string;
}

export interface ReadingHistory {
  manhwaId: string;
  chapterId: string;
  pageNumber: number;
  timestamp: string;
}
