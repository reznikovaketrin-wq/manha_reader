import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('users').select('id, email').limit(10);
    if (error) throw error;
    return NextResponse.json({ users: data || [] });
  } catch (error) {
    console.error('Debug users error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
