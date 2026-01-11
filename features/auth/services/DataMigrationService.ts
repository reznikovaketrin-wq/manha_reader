// features/auth/services/DataMigrationService.ts

'use client';

import { supabase } from '@/lib/supabase-client';
import { syncGuestReadingHistory } from '@/lib/supabase-client';
import { MigrationResult } from '../types';

class DataMigrationService {
  private readonly STORAGE_KEYS = {
    READING_HISTORY: 'manhwa_reading_history',
    BOOKMARKS: 'manhwa_bookmarks',
    READING_PROGRESS: 'manhwa_reading_progress',
    TRIW_READING_HISTORY: 'triw_reading_history', // NEW: guest read chapters tracking
  };

  // ===== MIGRATE READING HISTORY =====
  async migrateReadingHistory(userId: string): Promise<number> {
    try {
      const historyStr = localStorage.getItem(this.STORAGE_KEYS.READING_HISTORY);
      if (!historyStr) return 0;

      const history = JSON.parse(historyStr);
      if (!Array.isArray(history) || history.length === 0) return 0;

      // Convert to database format
      const records = history.map((item: any) => ({
        user_id: userId,
        manhwa_id: item.manhwaId || item.id,
        chapter_id: item.chapterId,
        read_at: item.readAt || new Date().toISOString(),
      }));

      // Insert into database (upsert to avoid duplicates)
      const { error } = await supabase
        .from('reading_history')
        .upsert(records, {
          onConflict: 'user_id,manhwa_id,chapter_id'
        });

      if (error) {
        console.error('[DataMigration] History migration error:', error);
        return 0;
      }

      return records.length;
    } catch (error) {
      console.error('[DataMigration] Failed to migrate history:', error);
      return 0;
    }
  }

  // ===== MIGRATE BOOKMARKS =====
  async migrateBookmarks(userId: string): Promise<number> {
    try {
      const bookmarksStr = localStorage.getItem(this.STORAGE_KEYS.BOOKMARKS);
      if (!bookmarksStr) return 0;

      const bookmarks = JSON.parse(bookmarksStr);
      if (!Array.isArray(bookmarks) || bookmarks.length === 0) return 0;

      // Convert to database format
      const records = bookmarks.map((item: any) => ({
        user_id: userId,
        manhwa_id: item.manhwaId || item.id,
        created_at: item.createdAt || new Date().toISOString(),
      }));

      // Insert into database (upsert to avoid duplicates)
      const { error } = await supabase
        .from('bookmarks')
        .upsert(records, {
          onConflict: 'user_id,manhwa_id'
        });

      if (error) {
        console.error('[DataMigration] Bookmarks migration error:', error);
        return 0;
      }

      return records.length;
    } catch (error) {
      console.error('[DataMigration] Failed to migrate bookmarks:', error);
      return 0;
    }
  }

  // ===== MIGRATE READING PROGRESS =====
  async migrateReadingProgress(userId: string): Promise<number> {
    try {
      const progressStr = localStorage.getItem(this.STORAGE_KEYS.READING_PROGRESS);
      if (!progressStr) return 0;

      const progress = JSON.parse(progressStr);
      if (!Array.isArray(progress) || progress.length === 0) return 0;

      // Convert to database format
      const records = progress.map((item: any) => ({
        user_id: userId,
        manhwa_id: item.manhwaId || item.id,
        chapter_id: item.chapterId,
        page_number: item.pageNumber || 0,
        updated_at: item.updatedAt || new Date().toISOString(),
      }));

      // Insert into database (upsert to avoid duplicates)
      const { error } = await supabase
        .from('reading_progress')
        .upsert(records, {
          onConflict: 'user_id,manhwa_id'
        });

      if (error) {
        console.error('[DataMigration] Progress migration error:', error);
        return 0;
      }

      return records.length;
    } catch (error) {
      console.error('[DataMigration] Failed to migrate progress:', error);
      return 0;
    }
  }

  // ===== MIGRATE ALL DATA =====
  async migrateAllData(userId: string): Promise<MigrationResult> {
    console.log('[DataMigration] Starting migration for user:', userId);

    const errors: string[] = [];
    let historyCount = 0;
    let bookmarksCount = 0;
    let progressCount = 0;
    let readChaptersCount = 0;

    try {
      // Migrate history
      try {
        historyCount = await this.migrateReadingHistory(userId);
        console.log('[DataMigration] History migrated:', historyCount);
      } catch (error: any) {
        errors.push(`History: ${error.message}`);
      }

      // Migrate bookmarks
      try {
        bookmarksCount = await this.migrateBookmarks(userId);
        console.log('[DataMigration] Bookmarks migrated:', bookmarksCount);
      } catch (error: any) {
        errors.push(`Bookmarks: ${error.message}`);
      }

      // Migrate progress
      try {
        progressCount = await this.migrateReadingProgress(userId);
        console.log('[DataMigration] Progress migrated:', progressCount);
      } catch (error: any) {
        errors.push(`Progress: ${error.message}`);
      }

      // NEW: Migrate guest read chapters (triw_reading_history)
      try {
        const syncRes: any = await syncGuestReadingHistory(userId);
        readChaptersCount = syncRes?.synced ?? 0;
        console.log('[DataMigration] Read chapters synced:', readChaptersCount);
      } catch (error: any) {
        errors.push(`Read chapters: ${error.message}`);
      }

      // Clear guest data if migration was successful
      if (errors.length === 0) {
        this.clearGuestData();
        console.log('[DataMigration] Guest data cleared');
      }

      return {
        success: errors.length === 0,
        migratedItems: {
          history: historyCount,
          bookmarks: bookmarksCount,
          progress: progressCount,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      console.error('[DataMigration] Migration failed:', error);
      return {
        success: false,
        migratedItems: {
          history: historyCount,
          bookmarks: bookmarksCount,
          progress: progressCount,
        },
        errors: [error.message],
      };
    }
  }

  // ===== CLEAR GUEST DATA =====
  clearGuestData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.READING_HISTORY);
      localStorage.removeItem(this.STORAGE_KEYS.BOOKMARKS);
      localStorage.removeItem(this.STORAGE_KEYS.READING_PROGRESS);
      localStorage.removeItem(this.STORAGE_KEYS.TRIW_READING_HISTORY); // NEW: clear guest read chapters
      console.log('[DataMigration] Guest data cleared from localStorage');
    } catch (error) {
      console.error('[DataMigration] Failed to clear guest data:', error);
    }
  }

  // ===== CHECK IF HAS GUEST DATA =====
  hasGuestData(): boolean {
    try {
      const hasHistory = !!localStorage.getItem(this.STORAGE_KEYS.READING_HISTORY);
      const hasBookmarks = !!localStorage.getItem(this.STORAGE_KEYS.BOOKMARKS);
      const hasProgress = !!localStorage.getItem(this.STORAGE_KEYS.READING_PROGRESS);
      const hasReadChapters = !!localStorage.getItem(this.STORAGE_KEYS.TRIW_READING_HISTORY); // NEW
      
      return hasHistory || hasBookmarks || hasProgress || hasReadChapters;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const dataMigrationService = new DataMigrationService();
export default dataMigrationService;
