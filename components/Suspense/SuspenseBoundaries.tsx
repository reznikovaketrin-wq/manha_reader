'use client';

import { Suspense, ReactNode } from 'react';
import { ManhwaPageSkeleton, ChaptersSkeletonLoader, CommentsSkeletonLoader } from '@/components/ManhwaPage/Skeleton';

/**
 * Точечные Suspense boundaries для разных частей страницы
 * Каждый блок загружается независимо
 */

interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  name?: string;
}

function SuspenseBoundary({ children, fallback, name }: SuspenseBoundaryProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * Компоненти для разных частей страницы
 */

// Для заголовка + metadata (быстро загружается)
export function TitleSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary
      name="title"
      fallback={
        <div style={{ height: '200px', backgroundColor: '#1A1A1A', borderRadius: '8px' }} />
      }
    >
      {children}
    </SuspenseBoundary>
  );
}

// Для списка глав (может быть долгим)
export function ChaptersSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary
      name="chapters"
      fallback={<ChaptersSkeletonLoader />}
    >
      {children}
    </SuspenseBoundary>
  );
}

// Для коментариев (отдельный fetch)
export function CommentsSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary
      name="comments"
      fallback={<CommentsSkeletonLoader />}
    >
      {children}
    </SuspenseBoundary>
  );
}

/**
 * Главная страница с точечными boundaries
 */
export function PageSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary
      name="page"
      fallback={<ManhwaPageSkeleton />}
    >
      {children}
    </SuspenseBoundary>
  );
}