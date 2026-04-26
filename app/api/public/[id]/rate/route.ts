/**
 * 📁 /app/api/public/[id]/rate/route.ts
 * 
 * 🌟 PUBLIC API - СОХРАНИТЬ ОЦЕНКУ МАНХВЫ
 * ✅ Исправлено: клиенты создаются внутри функции
 * 
 * POST /api/public/:id/rate
 * 
 * Body:
 * {
 *   rating: 8,      // 1-10
 *   userId: "uuid"  // user ID из Supabase Auth
 * }
 * 
 * Возвращает:
 * {
 *   success: true,
 *   userRating: 8,
 *   newAverageRating: 8.3,
 *   totalRatings: 125
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabaseAnon } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Создаём клиенты ВНУТРИ функции
    const supabaseAdmin = getSupabaseAdmin();
    const supabaseAnon = getSupabaseAnon();

    const manhwaId = params.id;
    const { rating, userId } = await request.json();

    // ============ ВАЛИДАЦИЯ ============

    if (!manhwaId) {
      return NextResponse.json(
        { success: false, message: 'ID манхвы не указан' },
        { status: 400 }
      );
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 10) {
      return NextResponse.json(
        { success: false, message: 'Оценка должна быть числом от 1 до 10' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'ID пользователя не указан' },
        { status: 400 }
      );
    }

    // ============ ПРОВЕРКА МАНХВЫ ============

    const { data: manhwa, error: manhwaError } = await supabaseAnon
      .from('admin_manhwa')
      .select('id, rating')
      .eq('id', manhwaId)
      .single();

    if (manhwaError || !manhwa) {
      return NextResponse.json(
        { success: false, message: 'Манхва не найдена' },
        { status: 404 }
      );
    }

    // ============ СОХРАНЕНИЕ ОЦЕНКИ ============

    // Проверяем есть ли уже оценка от этого пользователя
    const { data: existingRating } = await supabaseAdmin
      .from('manhwa_ratings')
      .select('id, rating')
      .eq('user_id', userId)
      .eq('manhwa_id', manhwaId)
      .maybeSingle();

    if (existingRating) {
      // Обновляем существующую оценку

      const { error: updateError } = await supabaseAdmin
        .from('manhwa_ratings')
        .update({
          rating: rating,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('manhwa_id', manhwaId);

      if (updateError) {
        console.error('❌ Ошибка обновления оценки:', updateError);
        throw updateError;
      }
    } else {
      // Создаем новую оценку

      const { error: insertError } = await supabaseAdmin
        .from('manhwa_ratings')
        .insert([
          {
            user_id: userId,
            manhwa_id: manhwaId,
            rating: rating
          }
        ]);

      if (insertError) {
        console.error('❌ Ошибка создания оценки:', insertError);
        throw insertError;
      }
    }

    // ============ ПЕРЕСЧЕТ СРЕДНЕЙ ОЦЕНКИ ============

    const { data: allRatings, error: ratingsError } = await supabaseAdmin
      .from('manhwa_ratings')
      .select('rating')
      .eq('manhwa_id', manhwaId);

    if (ratingsError) {
      console.error('❌ Ошибка получения оценок:', ratingsError);
      throw ratingsError;
    }

    if (!allRatings || allRatings.length === 0) {
      console.error('❌ Нет оценок найдено');
      throw new Error('Ошибка при расчете средней оценки');
    }

    // Вычисляем среднюю оценку
    const totalSum = allRatings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
    const newAverageRating = parseFloat((totalSum / allRatings.length).toFixed(1));
    const totalRatings = allRatings.length;

    // ============ ОБНОВЛЕНИЕ МАНХВЫ ============

    const { error: updateManhwaError } = await supabaseAdmin
      .from('admin_manhwa')
      .update({
        rating: newAverageRating
      })
      .eq('id', manhwaId);

    if (updateManhwaError) {
      console.error('⚠️ Ошибка обновления манхвы:', updateManhwaError);
      // Не прерываем, оценка уже сохранена
    } else {
    }

    // ============ УСПЕШНЫЙ ОТВЕТ ============

    const response = {
      success: true,
      message: 'Оценка сохранена успешно',
      userRating: rating,
      newAverageRating: newAverageRating,
      totalRatings: totalRatings
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Ошибка при сохранении оценки'
      },
      { status: 500 }
    );
  }
}