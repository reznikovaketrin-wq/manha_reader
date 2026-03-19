/**
 * 📁 lib/library-types.ts
 * Типи для бібліотеки користувача
 */

// Статуси манхв у бібліотеці
export type ManhwaLibraryStatus = 
  | 'reading'      // Читаю
  | 'planned'      // В планах
  | 'completed'    // Прочитано
  | 'rereading'    // Перечитую
  | 'postponed'    // Відкладено
  | 'dropped';     // Покинуто

// Локалізація статусів (українською)
export const MANHWA_STATUS_LABELS: Record<ManhwaLibraryStatus, string> = {
  reading: 'Читаю',
  planned: 'Заплановано',
  completed: 'Прочитано',
  rereading: 'Перечитую',
  postponed: 'Відкладено',
  dropped: 'Покинуто',
};

// Іконки для статусів (emoji або можна замінити на SVG)
export const MANHWA_STATUS_ICONS: Record<ManhwaLibraryStatus, string> = {
  reading: '📖',
  planned: '📅',
  completed: '✅',
  rereading: '🔄',
  postponed: '⏸️',
  dropped: '❌',
};

// Модель запису в бібліотеці
export interface UserManhwaListItem {
  id: string;
  user_id: string;
  manhwa_id: string;
  status: ManhwaLibraryStatus;
  created_at: string;
  updated_at: string;
}

// Розширена модель з додатковими даними манхви та історії
export interface UserManhwaListItemExtended extends UserManhwaListItem {
  manhwa_title?: string;
  manhwa_cover?: string;
  manhwa_type?: string;
  last_read_chapter?: string;
  last_read_chapter_number?: number;
  last_read_at?: string;
  total_chapters?: number;
}

// Дані для групування по статусам (для вкладок)
export interface LibraryByStatus {
  status: ManhwaLibraryStatus;
  label: string;
  count: number;
  items: UserManhwaListItemExtended[];
}

// Payload для створення/оновлення запису
export interface UpsertManhwaListPayload {
  manhwa_id: string;
  status: ManhwaLibraryStatus;
}

// Відповідь сервера
export interface ManhwaListResponse {
  success: boolean;
  data?: UserManhwaListItem | UserManhwaListItemExtended[];
  error?: string;
}
