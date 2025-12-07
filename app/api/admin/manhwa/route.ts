/**
 * 📁 /app/api/admin/manhwa/route.ts
 * 
 * Эндпоинт для управления ВСЕМИ манхвами
 * 
 * GET  /api/admin/manhwa → получить список всех манхв (для админки)
 * POST /api/admin/manhwa → создать новую манхву
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

// GET - получить все манхвы
export async function GET(request: NextRequest) {
  try {
    console.log('📚 [API] GET /admin/manhwa');

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
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('✅ [API] Found', data?.length || 0, 'manhwa');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ [API] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: error instanceof Error && error.message.includes('admin') ? 403 : 500 }
    );
  }
}

// POST - создать новую манхву
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [API] POST /admin/manhwa');

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const body = await request.json();
    const {
      id,
      title,
      description,
      short_description,
      status,
      rating,
      tags,
      cover_image,
      bg_image,
      char_image,
      publication_type,
      type,
    } = body;

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(URL, SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from('admin_manhwa')
      .insert({
        id,
        title,
        description: description || '',
        short_description: short_description || '',
        status: status || 'ongoing',
        rating: rating || 0,
        tags: tags || [],
        cover_image: cover_image || null,
        bg_image: bg_image || null,
        char_image: char_image || null,
        publication_type: publication_type || 'uncensored',
        type: type || 'manhwa',
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ [API] Manhwa created:', id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ [API] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 400 }
    );
  }
}