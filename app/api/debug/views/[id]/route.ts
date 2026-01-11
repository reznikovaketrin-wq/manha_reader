import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const id = params.id;

    const { data: logs, error: logsErr } = await supabase
      .from('views_logs')
      .select('*')
      .eq('manhwa_id', id)
      .order('created_at', { ascending: false });

    if (logsErr) throw logsErr;

    const { data: views, error: viewsErr } = await supabase
      .from('views')
      .select('*')
      .eq('manhwa_id', id)
      .maybeSingle();

    if (viewsErr) throw viewsErr;

    return NextResponse.json({ logs: logs || [], views: views || null });
  } catch (error) {
    console.error('Debug views error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
