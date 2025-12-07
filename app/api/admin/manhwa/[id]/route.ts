/**
 * 📁 /app/api/admin/manhwa/[id]/route.ts
 * 
 * Эндпоинт для РЕДАКТИРОВАНИЯ КОНКРЕТНОЙ манхвы
 * [id] = ID манхвы (например: "lycar-ta-vidma")
 * 
 * GET    /api/admin/manhwa/:id → получить манхву по ID
 * PUT    /api/admin/manhwa/:id → обновить все поля манхвы
 * DELETE /api/admin/manhwa/:id → удалить манхву
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function verifyAdmin(token: string) {
  const supabaseUser = createClient(URL, ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !authData.user) throw new Error('Unauthorized');

  const supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY);

  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (userError || userData?.role !== 'admin') throw new Error('Not an admin');
  return { user: authData.user, userData };
}

// GET - получить конкретную манхву
export async function GET(request: NextRequest, { params }: any) {
  try {
    const id = params.id;
    console.log('📖 [API] GET /admin/manhwa/' + id);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const supabase = createClient(URL, SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from('admin_manhwa')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [API] Error fetching:', error);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    console.log('✅ [API] Fetched:', data.title);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// PUT - обновить манхву
export async function PUT(request: NextRequest, { params }: any) {
  try {
    const id = params.id;
    console.log('✏️ [API] PUT /admin/manhwa/' + id);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const body = await request.json();

    const supabase = createClient(URL, SERVICE_ROLE_KEY);

    // Построить update объект динамически
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.short_description !== undefined) updateData.short_description = body.short_description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.publication_type !== undefined) updateData.publication_type = body.publication_type;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.cover_image !== undefined) updateData.cover_image = body.cover_image;
    if (body.bg_image !== undefined) updateData.bg_image = body.bg_image;
    if (body.char_image !== undefined) updateData.char_image = body.char_image;
    if (body.schedule_label !== undefined) updateData.schedule_label = body.schedule_label;
    if (body.schedule_note !== undefined) updateData.schedule_note = body.schedule_note;

    const { data, error } = await supabase
      .from('admin_manhwa')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ [API] Updated:', data.title);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE - удалить манхву
export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const id = params.id;
    console.log('🗑️ [API] DELETE /admin/manhwa/' + id);

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const supabase = createClient(URL, SERVICE_ROLE_KEY);

    // Только удаляем из БД, не трогаем R2 (временно)
    const { error } = await supabase
      .from('admin_manhwa')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('✅ [API] Deleted: ' + id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [API] Delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}