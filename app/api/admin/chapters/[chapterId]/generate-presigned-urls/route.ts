import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSupabaseAdmin, getSupabaseWithToken } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function verifyAdmin(token: string) {
  const supabaseUser = getSupabaseWithToken(token);
  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !authData.user) throw new Error('Unauthorized');

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (userError || userData?.role !== 'admin') throw new Error('Not an admin');
  return { user: authData.user };
}

// POST - генерация presigned URLs для прямой загрузки в R2
export async function POST(request: NextRequest, { params }: any) {
  try {
    const chapterId = params.chapterId;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyAdmin(token);

    const body = await request.json();
    const { manhwaId, chapterNumber, files } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files specified' }, { status: 400 });
    }

    console.log(`🔑 Generating ${files.length} presigned URL(s)...`);

    const presignedUrls: Array<{ pageNumber: number; fileName: string; uploadUrl: string; filePath: string }> = [];

    for (const fileInfo of files) {
      const { pageNumber, fileName, contentType } = fileInfo;
      const ext = fileName.split('.').pop() || 'jpg';
      const sanitizedFileName = `page_${pageNumber}.${ext}`;
      const filePath = `${manhwaId}/chapters/${chapterNumber}/${sanitizedFileName}`;

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filePath,
        ContentType: contentType || 'image/jpeg',
      });

      // Генерируем presigned URL с TTL 10 минут
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

      presignedUrls.push({
        pageNumber,
        fileName: sanitizedFileName,
        uploadUrl,
        filePath,
      });
    }

    console.log(`✅ Generated ${presignedUrls.length} presigned URL(s)`);

    return NextResponse.json({
      success: true,
      presignedUrls,
    });
  } catch (error) {
    console.error('❌ Error generating presigned URLs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate presigned URLs' },
      { status: 500 }
    );
  }
}
