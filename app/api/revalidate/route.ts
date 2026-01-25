/**
 * 📁 /app/api/revalidate/route.ts
 * 
 * 🔄 API для очистки кеша на Vercel
 * 
 * Використання:
 * POST /api/revalidate?secret=YOUR_SECRET&path=/api/public/MANHWA_ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Перевірка секретного ключа для безпеки
    const secret = request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.REVALIDATE_SECRET || 'dev-secret-123';
    
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Отримати шлях для ребалідації
    const path = request.nextUrl.searchParams.get('path');
    const manhwaId = request.nextUrl.searchParams.get('manhwaId');
    
    if (path) {
      // Ребалідація конкретного шляху
      revalidatePath(path);
      console.log(`✅ [Revalidate API] Revalidated path: ${path}`);
      
      return NextResponse.json({
        success: true,
        revalidated: true,
        path,
        now: Date.now(),
      });
    }
    
    if (manhwaId) {
      // Ребалідація всіх шляхів пов'язаних з манхвою
      revalidatePath(`/api/public/${manhwaId}`);
      revalidatePath(`/manhwa/${manhwaId}`);
      revalidatePath('/');
      
      console.log(`✅ [Revalidate API] Revalidated manhwa: ${manhwaId}`);
      
      return NextResponse.json({
        success: true,
        revalidated: true,
        manhwaId,
        paths: [
          `/api/public/${manhwaId}`,
          `/manhwa/${manhwaId}`,
          '/',
        ],
        now: Date.now(),
      });
    }
    
    return NextResponse.json(
      { error: 'Missing path or manhwaId parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ [Revalidate API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Revalidation failed',
      },
      { status: 500 }
    );
  }
}

// Також підтримка GET для швидкого тестування
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST method with ?secret=XXX&manhwaId=XXX',
    example: '/api/revalidate?secret=YOUR_SECRET&manhwaId=yak-otrymaty-tu-pokoivku',
  });
}
