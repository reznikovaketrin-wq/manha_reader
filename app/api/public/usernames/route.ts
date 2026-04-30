/**
 * GET /api/public/usernames?ids=uuid1,uuid2,...
 * Returns { id: string; username: string }[] for requested user IDs.
 * Uses service role key to bypass RLS — safe because only usernames are exposed.
 */

import { getSupabaseAdmin } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json([]);
  }

  const ids = idsParam.split(',').filter(Boolean).slice(0, 100); // max 100
  if (ids.length === 0) return NextResponse.json([]);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('id, username')
      .in('id', ids);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
