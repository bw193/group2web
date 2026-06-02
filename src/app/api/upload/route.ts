import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getSession } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import { slugify } from '@/lib/utils';
import { OPTIMIZED_WIDTHS } from '@/lib/optimized-images';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
const RASTER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Folders whose images are served straight from Supabase's CDN (bypassing
// Vercel image optimization). These get several pre-generated WebP widths so
// the browser can pick per device. Everything else gets a single compressed
// WebP that Vercel still resizes downstream (hero/products stay on Vercel).
const GALLERY_FOLDERS = new Set(['facility', 'certifications']);
const SINGLE_WIDTH = 2000;
const LARGEST = OPTIMIZED_WIDTHS[OPTIMIZED_WIDTHS.length - 1];

function shortId(): string {
  return Math.random().toString(36).slice(2, 8).padEnd(6, '0');
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'misc';
    const slug = (formData.get('slug') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Clean, descriptive base name: the product slug when provided, otherwise a
    // slugified original filename. The short id keeps a product's multiple
    // images unique so they never overwrite each other.
    const dotIdx = file.name.lastIndexOf('.');
    const origBase = dotIdx >= 0 ? file.name.slice(0, dotIdx) : file.name;
    const base = slugify(slug) || slugify(origBase) || 'image';
    const id = shortId();

    // SVG / GIF: store as-is — sharp would rasterize a vector or flatten a GIF.
    if (!RASTER_TYPES.includes(file.type)) {
      const ext = dotIdx >= 0 ? file.name.slice(dotIdx).toLowerCase() : '';
      const key = `${folder}/${base}-${id}${ext}`;
      const fullUrl = await uploadFile(key, await file.arrayBuffer(), file.type);
      return NextResponse.json({ url: key, fullUrl });
    }

    const input = Buffer.from(await file.arrayBuffer());
    // `.rotate()` with no args bakes in EXIF orientation; width-only resize keeps
    // the original aspect ratio (no crop); `withoutEnlargement` never upscales.
    const pipeline = sharp(input).rotate();

    if (GALLERY_FOLDERS.has(folder)) {
      const variants = await Promise.all(
        OPTIMIZED_WIDTHS.map(async (width) => {
          const out = await pipeline
            .clone()
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          const key = `${folder}/${base}-${id}-opt@${width}.webp`;
          const fullUrl = await uploadFile(key, out, 'image/webp');
          return { width, key, fullUrl };
        })
      );
      // Store the largest variant as the canonical DB path (safe fallback src;
      // the gallery loader derives the smaller widths from it).
      const canonical = variants.find((v) => v.width === LARGEST)!;
      return NextResponse.json({ url: canonical.key, fullUrl: canonical.fullUrl });
    }

    // Products / banners / misc: one compressed WebP source; Vercel resizes it.
    const out = await pipeline
      .resize({ width: SINGLE_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const key = `${folder}/${base}-${id}.webp`;
    const fullUrl = await uploadFile(key, out, 'image/webp');
    return NextResponse.json({ url: key, fullUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
