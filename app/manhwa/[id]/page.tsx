// app/manhwa/[id]/page.tsx
'use client';

import { ManhwaPageWrapper } from '@/components/ManhwaPage/ManhwaPageWrapper';

/**
 * ManhwaPage - основная страница манхвы
 * 
 * Этот файл простой и легкий!
 * Вся сложная логика находится в:
 * - ManhwaPageWrapper.tsx (обертка с ErrorBoundary)
 * - ManhwaPage.tsx (основной компонент)
 */
export default function Page() {
  return <ManhwaPageWrapper />;
}