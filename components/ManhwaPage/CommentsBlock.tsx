'use client';

import { memo } from 'react';
import { ManhwaCommentsComponent } from '@/components/manhwa-comments';

interface CommentsBlockProps {
  manhwaId: string;
  hideHeader?: boolean;
  onCommentsCountChange?: (count: number) => void;
}

/**
 * CommentsBlock - мемоизированный wrapper для Comments
 * Предотвращает ненужные ререндеры ManhwaCommentsComponent
 */
export const CommentsBlock = memo(function CommentsBlock({
  manhwaId,
  hideHeader = false,
  onCommentsCountChange,
}: CommentsBlockProps) {
  return (
    <ManhwaCommentsComponent
      manhwaId={manhwaId}
      hideHeader={hideHeader}
      onCommentsCountChange={onCommentsCountChange}
    />
  );
});