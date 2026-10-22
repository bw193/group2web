import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { lookUpYouTubeDuration } from '@/lib/youtube-duration';

// The CMS's Derive button asks here for a YouTube video's length. Browsers
// can't read YouTube's pages (CORS), so the server looks it up.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get('url') || '';
  const durationSeconds = url.length <= 500 ? await lookUpYouTubeDuration(url) : null;
  return NextResponse.json({ durationSeconds });
}
