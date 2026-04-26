/**
 * 📁 /app/api/public/[id]/chapters/[chapterId]/route.ts
 * 
 * 🌐 PUBLIC API - ПОЛУЧИТЬ СТОРІНКИ РОЗДІЛА
 * ✅ Исправлено: клиент создается внутри функции
 * 
 * GET /api/public/:id/chapters/:chapterId
 * 
 * Параметры:
 *   id - ID манхвы
 *   chapterId - ID розділа
 * 
 * Возвращает:
 * {
 *   id: "01",
 *   number: 1,
 *   title: "Розділ 1",
 *   pagesCount: 4,
 *   status: "published",
 *   pages: [
 *     {
 *       number: 1,
 *       imageUrl: "https://r2.dev/...",
 *       width: 1080,
 *       height: 1440
 *     },
 *     ...
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnon, getSupabaseWithToken } from '@/lib/supabase-server';

export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; chapterId: string } }
) {
  try {
    const { id, chapterId } = params;

    // ✅ Создаём клиент ВНУТРИ функции
    const supabase = getSupabaseAnon();

    // Получить розділ
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('manhwa_id', id)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }
    
    // 🔒 Проверка VIP доступа
    let userRole = 'user'; // По умолчанию обычный пользователь
    let userId = 'anonymous';
    
    // Попытка получить роль авторизованного пользователя
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const supabaseWithAuth = getSupabaseWithToken(token);
        const { data: authData } = await supabaseWithAuth.auth.getUser();
        
        if (authData.user) {
          userId = authData.user.id;
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', authData.user.id)
            .single();
          
          if (userData?.role) {
            userRole = userData.role;
          }
        }
      } catch (e) {
      }
    }
    
    // Админ и VIP имеют полный доступ ко всем главам
    const hasFullAccess = userRole === 'vip' || userRole === 'admin';
    
    // Проверка VIP Only контента
    if (chapter.vip_only && !hasFullAccess) {
      return NextResponse.json(
        { 
          error: 'VIP_ONLY',
          message: 'Цей розділ доступний тільки для VIP користувачів'
        }, 
        { status: 403 }
      );
    }
    
    // Проверка раннего доступа для VIP
    if (chapter.vip_early_days > 0 && chapter.public_available_at) {
      const now = new Date();
      const availableDate = new Date(chapter.public_available_at);
      
      // Обычные пользователи должны ждать до publicAvailableAt
      // VIP и админ имеют ранний доступ
      if (!hasFullAccess && now < availableDate) {
        return NextResponse.json(
          { 
            error: 'EARLY_ACCESS',
            message: 'Цей розділ буде доступний для всіх користувачів пізніше',
            availableAt: availableDate.toISOString()
          }, 
          { status: 403 }
        );
      }
    }

    // Получить сторінки
    const { data: pages, error: pagesError } = await supabase
      .from('chapter_pages')
      .select('*')
      .eq('chapter_id', chapter.id)
      .order('page_number', { ascending: true });

    if (pagesError) throw pagesError;

    // Структурированный ответ (camelCase)
    const response = {
      id: chapter.id,
      chapterNumber: chapter.chapter_number,
      title: chapter.title,
      description: chapter.description,
      pagesCount: chapter.pages_count,
      status: chapter.status,
      publishedAt: chapter.published_at,
      scheduledAt: chapter.scheduled_at,
      pages: (pages || []).map((page: any) => ({
        number: page.page_number,
        imageUrl: page.image_url,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch chapter pages' },
      { status: 500 }
    );
  }
}