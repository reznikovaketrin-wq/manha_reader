/**
 * 📁 /app/api/admin/users/[id]/role/route.ts
 * 
 * API для управления ролями пользователей (только для админов)
 * 
 * POST /api/admin/users/[id]/role → изменить роль пользователя
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin';
import { getSupabaseAdminClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    // Проверяем права админа
    const result = await verifyAdminAccess();
    
    if (!result) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    const body = await request.json();
    const { role, durationType, customDays } = body;

    // Валидация роли
    if (!role || !['user', 'vip', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: user, vip, or admin' },
        { status: 400 }
      );
    }

    // Валидация типа продолжительности
    if (durationType && !['permanent', 'month', 'custom_days'].includes(durationType)) {
      return NextResponse.json(
        { error: 'Invalid duration type. Must be: permanent, month, or custom_days' },
        { status: 400 }
      );
    }

    const userId = params.id;

    // Изменяем роль (выполняем обновление напрямую, чтобы избежать несоответствий типов при сборке)
    const supabase = getSupabaseAdminClient();

    let roleExpiration: string | null = null;
    const dur = (durationType as 'permanent' | 'month' | 'custom_days') || 'permanent';

    if (dur === 'month') {
      const now = new Date();
      now.setMonth(now.getMonth() + 1);
      roleExpiration = now.toISOString();
    } else if (dur === 'custom_days' && customDays) {
      const now = new Date();
      now.setDate(now.getDate() + Number(customDays));
      roleExpiration = now.toISOString();
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        role,
        role_duration_type: dur,
        role_expiration: roleExpiration,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ [API] Error updating role:', updateError);
      return NextResponse.json({ error: updateError.message || 'Failed to update role' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { userId, role, durationType, customDays }
    });

  } catch (error) {
    console.error('❌ [API] Error updating user role:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
