import { NextRequest, NextResponse } from 'next/server';
import { getDb, withDbRetryFast } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { loadUsedDescriptions } from '@/lib/products';

// Descriptions already used on photos in product descriptions, so the CMS
// editor can stop staff reusing one (src/lib/description-images.ts). Pass
// `exclude` with the product being edited; its own photos don't count.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'en';
  const exclude = parseInt(searchParams.get('exclude') || '', 10);

  try {
    const images = await withDbRetryFast(() =>
      loadUsedDescriptions(getDb(), locale, Number.isFinite(exclude) ? exclude : null),
    );
    return NextResponse.json({ locale, images });
  } catch (error) {
    console.error('Description images error:', error);
    return NextResponse.json({ error: 'Failed to load photo descriptions' }, { status: 500 });
  }
}
