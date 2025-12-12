/**
 * 📁 /app/api/public/[id]/rate/route.ts
 * 
 * 🌟 PUBLIC API - СОХРАНИТЬ ОЦЕНКУ МАНХВЫ
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
import { createClient } from '@supabase/supabase-js';

// Service Role для записи в БД
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Anon key для чтения
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const manhwaId = params.id;
    const { rating, userId } = await request.json();

    console.log(`⭐ [API] POST /api/public/${manhwaId}/rate`, {
      rating,
      userId: userId?.substring(0, 8) + '...'
    });

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
      console.log(`⚠️ Манхва не найдена: ${manhwaId}`);
      return NextResponse.json(
        { success: false, message: 'Манхва не найдена' },
        { status: 404 }
      );
    }

    console.log(`✅ Манхва найдена: ${manhwaId}, текущий рейтинг: ${manhwa.rating}`);

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
      console.log(`🔄 Обновляю оценку пользователя...`);

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

      console.log(`✅ Оценка обновлена`);
    } else {
      // Создаем новую оценку
      console.log(`➕ Создаю новую оценку...`);

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

      console.log(`✅ Оценка создана`);
    }

    // ============ ПЕРЕСЧЕТ СРЕДНЕЙ ОЦЕНКИ ============

    console.log(`📊 Пересчитываю среднюю оценку...`);

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
    const totalSum = allRatings.reduce((sum, r) => sum + r.rating, 0);
    const newAverageRating = parseFloat((totalSum / allRatings.length).toFixed(1));
    const totalRatings = allRatings.length;

    console.log(`📈 Новая средняя оценка: ${newAverageRating} (всего: ${totalRatings})`);

    // ============ ОБНОВЛЕНИЕ МАНХВЫ ============

    console.log(`🔄 Обновляю манхву...`);

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
      console.log(`✅ Манхва обновлена`);
    }

    // ============ УСПЕШНЫЙ ОТВЕТ ============

    const response = {
      success: true,
      message: 'Оценка сохранена успешно',
      userRating: rating,
      newAverageRating: newAverageRating,
      totalRatings: totalRatings
    };

    console.log(`✅ Отправляю ответ:`, response);

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