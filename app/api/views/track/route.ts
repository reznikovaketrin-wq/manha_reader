import { NextRequest, NextResponse } from 'next/server';
import { trackManhwaViewServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { manhwaId, userId } = body;

    if (!manhwaId) {
      return NextResponse.json(
        { error: 'manhwaId is required' },
        { status: 400 }
      );
    }

    // Forward optional userId/clientId to enable server-side dedupe during tests
    const result = await trackManhwaViewServer(manhwaId, undefined, userId);

    if (!result.success) {
      throw result.error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}