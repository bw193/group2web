import { buildEmbedUrl } from '@/lib/video-utils';

export const YOUTUBE_API_KEY_ENV = 'YOUTUBE_API_KEY';

type YouTubeDurationEnv = Partial<Record<typeof YOUTUBE_API_KEY_ENV, string>>;
type YouTubeDurationFetch = (
  input: string,
  init: { headers?: Record<string, string>; signal: AbortSignal; cache: 'no-store' },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

/** The id behind a YouTube watch, Shorts, youtu.be or embed link; '' for anything else. */
export function youTubeIdFromUrl(url: string): string {
  return buildEmbedUrl(url).match(/^https:\/\/www\.youtube\.com\/embed\/([\w-]{11})$/)?.[1] || '';
}

/** Seconds in an ISO 8601 duration such as "PT2M10S", the YouTube Data API's format. */
export function secondsFromIsoDuration(value: string): number | null {
  const match = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return null;
  const [, days, hours, mins, secs] = match.map((part) => Number(part || 0));
  const total = days * 86400 + hours * 3600 + mins * 60 + secs;
  return total > 0 ? total : null;
}

/** The length a YouTube watch page gives for this video, from its player data. */
export function lengthFromWatchPage(html: string, id: string): number | null {
  const start = html.indexOf(`"videoDetails":{"videoId":"${id}"`);
  if (start < 0) return null;
  const secs = Number(html.slice(start, start + 2000).match(/"lengthSeconds":"(\d+)"/)?.[1] || 0);
  return secs > 0 ? secs : null;
}

/**
 * A YouTube video's length in seconds, or null when it can't be found. Asks the
 * YouTube Data API when YOUTUBE_API_KEY is set; otherwise, or if that fails,
 * reads the video's public watch page, whose layout YouTube can change at any time.
 */
export async function lookUpYouTubeDuration(
  url: string,
  options: { env?: YouTubeDurationEnv; fetchImpl?: YouTubeDurationFetch } = {},
): Promise<number | null> {
  const id = youTubeIdFromUrl(url);
  if (!id) return null;
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiKey = env[YOUTUBE_API_KEY_ENV]?.trim();

  if (apiKey) {
    try {
      const res = await fetchImpl(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${encodeURIComponent(apiKey)}`,
        { signal: AbortSignal.timeout(8_000), cache: 'no-store' },
      );
      if (res.ok) {
        const data = JSON.parse(await res.text());
        const secs = secondsFromIsoDuration(data?.items?.[0]?.contentDetails?.duration || '');
        if (secs) return secs;
      }
    } catch {}
  }

  try {
    const res = await fetchImpl(`https://www.youtube.com/watch?v=${id}`, {
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });
    return res.ok ? lengthFromWatchPage(await res.text(), id) : null;
  } catch {
    return null;
  }
}
