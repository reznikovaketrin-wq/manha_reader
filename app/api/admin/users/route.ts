/**
 * 📁 /app/api/admin/users/route.ts
 * 
 * API для получения списка пользователей (только для админов)
 * 
 * GET /api/admin/users → получить список всех пользователей
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('👥 [API] GET /admin/users');

    // Проверяем права админа
    const result = await verifyAdminAccess();
    
    if (!result) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();

    // Получаем пользователей с информацией из обеих таблиц
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, username, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [API] Error fetching users:', error);
      throw error;
    }

    console.log(`✅ [API] Found ${users?.length || 0} users`);

    return NextResponse.json({
      success: true,
      data: users || [],
    });

  } catch (error) {
    console.error('❌ [API] Error in GET /admin/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
