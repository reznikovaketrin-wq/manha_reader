/**
 * POST /api/profile/sync-username
 * Updates display_name in all comments (manhwa_comments + chapter_comments)
 * for the authenticated user after a username change.
 */

import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify user identity
    const supabaseUser = getSupabaseWithToken(token);
    const { data: authData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await request.json();
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }

    const userId = authData.user.id;
    const supabase = getSupabaseAdmin();

    // Update display_name in both comment tables in parallel
    const [manhwaResult, chapterResult] = await Promise.all([
      supabase
        .from('manhwa_comments')
        .update({ display_name: username })
        .eq('user_id', userId),
      supabase
        .from('chapter_comments')
        .update({ display_name: username })
        .eq('user_id', userId),
    ]);

    if (manhwaResult.error) console.error('[sync-username] manhwa_comments error:', manhwaResult.error);
    if (chapterResult.error) console.error('[sync-username] chapter_comments error:', chapterResult.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[sync-username] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
