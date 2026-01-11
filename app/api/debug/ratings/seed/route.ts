import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { manhwaId, userId, rating } = await request.json();

    if (!manhwaId || !userId || typeof rating !== 'number') {
      return NextResponse.json({ error: 'manhwaId, userId and rating required' }, { status: 400 });
    }

    // Upsert user's rating
    const { data: existing } = await supabaseAdmin
      .from('manhwa_ratings')
      .select('id')
      .eq('manhwa_id', manhwaId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error: updErr } = await supabaseAdmin
        .from('manhwa_ratings')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabaseAdmin
        .from('manhwa_ratings')
        .insert([{ user_id: userId, manhwa_id: manhwaId, rating }]);
      if (insErr) throw insErr;
    }

    // Recompute average
    const { data: allRatings, error: ratingsErr } = await supabaseAdmin
      .from('manhwa_ratings')
      .select('rating')
      .eq('manhwa_id', manhwaId);
    if (ratingsErr) throw ratingsErr;

    const totalSum = (allRatings || []).reduce((s: number, r: any) => s + r.rating, 0);
    const newAverage = parseFloat(((allRatings?.length ? totalSum / allRatings.length : 0)).toFixed(1));

    const { error: updManhwaErr } = await supabaseAdmin
      .from('admin_manhwa')
      .update({ rating: newAverage })
      .eq('id', manhwaId);
    if (updManhwaErr) throw updManhwaErr;

    return NextResponse.json({ success: true, newAverage, totalRatings: allRatings?.length || 0 });
  } catch (error) {
    console.error('Seed rating error:', error);
    let serial = null;
    try { serial = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error))); } catch (e) { serial = String(error); }
    return NextResponse.json({ error: serial }, { status: 500 });
  }
}
