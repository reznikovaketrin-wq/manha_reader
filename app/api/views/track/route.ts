import { NextRequest, NextResponse } from 'next/server';
import { trackManhwaView } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { manhwaId } = body;

    if (!manhwaId) {
      return NextResponse.json(
        { error: 'manhwaId is required' },
        { status: 400 }
      );
    }

    const result = await trackManhwaView(manhwaId);

    if (!result.success) {
      throw result.error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}