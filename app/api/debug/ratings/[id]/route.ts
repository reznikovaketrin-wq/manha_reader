import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const id = params.id;

    const { data: ratings, error: ratingsErr } = await supabase
      .from('manhwa_ratings')
      .select('user_id, rating, created_at')
      .eq('manhwa_id', id)
      .order('created_at', { ascending: true });

    if (ratingsErr) throw ratingsErr;

    const { data: manhwa, error: manhwaErr } = await supabase
      .from('admin_manhwa')
      .select('id, rating')
      .eq('id', id)
      .maybeSingle();

    if (manhwaErr) throw manhwaErr;

    return NextResponse.json({ ratings: ratings || [], manhwa: manhwa || null });
  } catch (error) {
    console.error('Debug ratings error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
