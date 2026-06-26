import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSignedStorageUpload, getSupabaseTusEndpoint, VIDEO_BUCKET } from '@/lib/storage';
import { slugify } from '@/lib/utils';

const VIDEO_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg',
  'video/quicktime': 'mov',
};

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE = 15 * 1024 * 1024;

function shortId(): string {
  return Math.random().toString(36).slice(2, 8).padEnd(6, '0');
}

function extensionFromName(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      kind?: string;
      fileName?: string;
      contentType?: string;
      size?: number;
      slug?: string;
    };

    const kind = body.kind === 'thumbnail' ? 'thumbnail' : body.kind === 'video' ? 'video' : null;
    if (!kind) {
      return NextResponse.json({ error: 'Invalid upload kind' }, { status: 400 });
    }

    const fileName = body.fileName || '';
    const contentType = body.contentType || '';
    const size = typeof body.size === 'number' ? body.size : 0;
    const allowed = kind === 'video' ? VIDEO_TYPES : IMAGE_TYPES;
    const maxSize = kind === 'video' ? MAX_VIDEO_SIZE : MAX_THUMBNAIL_SIZE;

    if (!allowed[contentType]) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (size < 1 || size > maxSize) {
      return NextResponse.json({ error: 'File size is outside the allowed range' }, { status: 400 });
    }

    const ext = allowed[contentType] || extensionFromName(fileName);
    const originalBase = fileName.replace(/\.[^.]+$/, '');
    const base = slugify(body.slug || originalBase) || (kind === 'video' ? 'video' : 'thumbnail');
    const folder = kind === 'video' ? 'videos' : 'thumbnails';
    const key = `${folder}/${base}-${shortId()}.${ext}`;
    const signed = await createSignedStorageUpload(VIDEO_BUCKET, key, { upsert: false });

    return NextResponse.json({
      bucket: VIDEO_BUCKET,
      path: key,
      publicUrl: signed.publicUrl,
      signedUrl: signed.signedUrl,
      token: signed.token,
      endpoint: getSupabaseTusEndpoint(),
      cacheControl: '31536000',
    });
  } catch (error) {
    console.error('video_upload_sign.failed', {
      err: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    return NextResponse.json({ error: 'Failed to create upload token' }, { status: 500 });
  }
}
