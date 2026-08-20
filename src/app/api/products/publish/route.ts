import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { triggerProductCatalogDeploy } from '@/lib/product-catalog-deploy';

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const result = await triggerProductCatalogDeploy();

  if (result.status === 'triggered') {
    return NextResponse.json({ status: 'triggered' });
  }

  if (result.status === 'not_configured') {
    return NextResponse.json(
      { status: 'not_configured', error: 'Product deploy hook is not configured' },
      { status: 503 },
    );
  }

  console.error('[products:publish] Deploy hook failed', {
    statusCode: result.statusCode,
    error: result.error,
  });

  return NextResponse.json(
    { status: 'failed', error: 'Failed to trigger deployment' },
    { status: 502 },
  );
}
