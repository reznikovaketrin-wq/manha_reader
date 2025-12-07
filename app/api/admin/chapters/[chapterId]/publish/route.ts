import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
    const { action, scheduledAt } = body; // action: 'publish' или 'schedule'

    const supabase = createClient(URL, SERVICE_ROLE_KEY);

    let updateData: any = {};

    if (action === 'publish') {
      // Опубликовать сейчас
      console.log('📤 Publishing now');
      updateData = {
        status: 'published',
        published_at: new Date().toISOString(),
        scheduled_at: null,
      };
    } else if (action === 'schedule') {
      // Отложенная публикация
      if (!scheduledAt) {
        return NextResponse.json(
          { error: 'scheduledAt is required for schedule action' },
          { status: 400 }
        );
      }
      console.log('⏰ Scheduling for:', scheduledAt);
      updateData = {
        status: 'scheduled',
        scheduled_at: scheduledAt,
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

    console.log('✅ [API] Chapter status updated:', data.status);
    return NextResponse.json({ data });
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

    const supabase = createClient(URL, SERVICE_ROLE_KEY);

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

    console.log('✅ [API] Scheduled publish cancelled');
    return NextResponse.json({ data });
  } catch (error) {
    console.error('❌ [API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cancel failed' },
      { status: 500 }
    );
  }
}