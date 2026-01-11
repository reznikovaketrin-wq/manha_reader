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
import { setUserRole } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 [API] POST /admin/users/[id]/role');

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

    // Изменяем роль
    const updateResult = await setUserRole(
      userId,
      role as 'user' | 'vip' | 'admin',
      durationType as 'permanent' | 'month' | 'custom_days',
      customDays
    );

    if ('error' in updateResult) {
      return NextResponse.json(
        { error: updateResult.error },
        { status: 500 }
      );
    }

    console.log(`✅ [API] Role updated for user ${userId}: ${role}`);
    
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
