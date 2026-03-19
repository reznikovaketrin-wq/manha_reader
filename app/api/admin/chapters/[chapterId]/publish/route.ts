/**
 * 📁 /app/api/admin/chapters/[chapterId]/publish/route.ts
 * 
 * ✅ ОПТИМИЗАЦИЯ: Очищаем кеш при публикации/планировании глав
 * ✅ Исправлено: используем getSupabaseWithToken и getSupabaseAdmin
 */

import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

async function verifyAdmin(token: string) {
  // ✅ Используем getSupabaseWithToken вместо createClient
  const supabaseUser = getSupabaseWithToken(token);

  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !authData.user) throw new Error('Unauthorized');

  const supabaseAdmin = getSupabaseAdmin();

  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (userError || userData?.role !== 'admin') throw new Error('Not an admin');
  return { user: authData.user };
}

// PUT - опубликовать главу или установить отложенную публикацию
export async function PUT(request: NextRequest, { params }: any) {
  try {
    const chapterId = params.chapterId;
    console.log('📤 [API] Publishing chapter:', chapterId);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const body = await request.json();
    const { action, scheduledAt, vip_only, vip_early_days } = body; // action: 'publish' или 'schedule'

    const supabase = getSupabaseAdmin();

    let updateData: any = {};

    if (action === 'publish') {
      // Опублікувати зараз
      // "Publish now" + vip_early_days: VIP отримує зараз, публіка — через N днів
      console.log('📤 Publishing now');
      
      const publishedAt = new Date();
      let publicAvailableAt = null;
      
      if (!vip_only && vip_early_days && vip_early_days > 0) {
        publicAvailableAt = new Date(publishedAt.getTime() + vip_early_days * 24 * 60 * 60 * 1000);
        console.log(`⏰ VIP gets access now. Public available at: ${publicAvailableAt.toISOString()}`);
      }
      
      updateData = {
        status: 'published',
        published_at: publishedAt.toISOString(),
        scheduled_at: null,
        vip_only: vip_only || false,
        vip_early_days: vip_early_days || 0,
        public_available_at: publicAvailableAt ? publicAvailableAt.toISOString() : null,
      };
    } else if (action === 'schedule') {
      // Відкладена публікація
      // scheduledAt = ПУБЛІЧНА дата (коли отримають доступ ВСІ)
      // VIP отримують доступ на vip_early_days днів РАНІШЕ
      if (!scheduledAt) {
        return NextResponse.json(
          { error: 'scheduledAt is required for schedule action' },
          { status: 400 }
        );
      }

      const publicDate = new Date(scheduledAt);
      let vipAccessAt: Date;

      if (!vip_only && vip_early_days && vip_early_days > 0) {
        // VIP бачить на N днів раніше за публічну дату
        vipAccessAt = new Date(publicDate.getTime() - vip_early_days * 24 * 60 * 60 * 1000);
        console.log(`⏰ Public date: ${publicDate.toISOString()}, VIP access: ${vipAccessAt.toISOString()} (${vip_early_days}d early)`);
      } else {
        // Без раннього доступу — VIP і всі отримують одночасно
        vipAccessAt = publicDate;
        console.log('📅 Scheduling (no VIP early access):', publicDate.toISOString());
      }

      updateData = {
        status: 'scheduled',
        // scheduled_at = дата доступу для VIP (або для всіх якщо early_days=0)
        scheduled_at: vipAccessAt.toISOString(),
        vip_only: vip_only || false,
        vip_early_days: vip_early_days || 0,
        // public_available_at = публічна дата (null якщо early_days=0, бо вони рівні)
        public_available_at: (!vip_only && vip_early_days && vip_early_days > 0)
          ? publicDate.toISOString()
          : null,
      };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('chapters')
      .update(updateData)
      .eq('id', chapterId)
      .select()
      .single();

    if (error) throw error;

    // ✅ Очищаем кеш при публикации
    console.log(`🔄 [Cache] Revalidating schedule cache after publish`);
    revalidateTag('schedule-data');
    
    if (data?.manhwa_id) {
      revalidateTag(`manhwa-${data.manhwa_id}`);
      revalidateTag(`chapters-${data.manhwa_id}`);
    }

    console.log('✅ [API] Chapter status updated:', data.status);
    return NextResponse.json({ data, cacheRevalidated: true });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Publish failed' },
      { status: 500 }
    );
  }
}

// DELETE - отменить отложенную публикацию
export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const chapterId = params.chapterId;
    console.log('❌ [API] Canceling scheduled publish for:', chapterId);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('chapters')
      .update({
        status: 'draft',
        scheduled_at: null,
      })
      .eq('id', chapterId)
      .select()
      .single();

    if (error) throw error;

    // ✅ Очищаем кеш при отмене
    console.log(`🔄 [Cache] Revalidating schedule cache after cancel`);
    revalidateTag('schedule-data');
    
    if (data?.manhwa_id) {
      revalidateTag(`manhwa-${data.manhwa_id}`);
    }

    console.log('✅ [API] Scheduled publish cancelled');
    return NextResponse.json({ data, cacheRevalidated: true });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cancel failed' },
      { status: 500 }
    );
  }
}