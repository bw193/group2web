import 'server-only';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'assets';

let storageClient: ReturnType<typeof createClient> | null = null;

function getStorageClient() {
  if (storageClient) {
    return storageClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for storage access.');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for storage access.');
  }

  storageClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return storageClient;
}

export async function uploadFile(
  key: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    // 1-year immutable cache: keys are unique per upload, so the bytes at a
    // given key never change. Critical for gallery images served straight from
    // Supabase's CDN (they don't get Vercel's cache otherwise).
    .upload(key, body, { contentType, upsert: true, cacheControl: '31536000' });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

export async function deleteFile(key: string): Promise<void> {
  const supabase = getStorageClient();
  const { error } = await supabase.storage.from(BUCKET).remove([key]);
  if (error) throw error;
}
