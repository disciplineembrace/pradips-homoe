/**
 * Supabase storage adapter — file storage for PDFs, images, audio, video.
 *
 * Buckets:
 *   - book-pdfs        — e-book PDF files
 *   - book-covers      — book cover images
 *   - user-avatars     — user profile pictures
 *   - audio-narration  — audio narration files for chapters
 *   - ocr-images       — OCR source images (uploaded for text extraction)
 *
 * Files in storage are METADATA references. The actual book content (text,
 * chapters) lives in Neon. This separation allows files to be served via
 * Supabase's CDN while content remains searchable in Neon.
 */
import { getSupabaseClient, getSupabaseServerClient, isSupabaseConfigured, isSupabaseServerConfigured } from '../client';

export type StorageBucket = 'book-pdfs' | 'book-covers' | 'user-avatars' | 'audio-narration' | 'ocr-images';

/**
 * Upload a file to a Supabase storage bucket (server-side, service role).
 */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: Buffer | Blob,
  opts: { contentType?: string; upsert?: boolean } = {},
): Promise<{ path: string; publicUrl?: string } | null> {
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .storage
    .from(bucket)
    .upload(path, file, {
      contentType: opts.contentType,
      upsert: opts.upsert ?? false,
    });
  if (error) throw new Error(`Failed to upload to ${bucket}: ${error.message}`);
  return { path: data.path };
}

/**
 * Get a signed (time-limited) URL for a private file.
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600,
): Promise<string | null> {
  if (!isSupabaseServerConfigured()) return null;
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw new Error(`Failed to get signed URL: ${error.message}`);
  return data.signedUrl;
}

/**
 * Get the public URL for a file in a public bucket.
 */
export async function getPublicUrl(
  bucket: StorageBucket,
  path: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseClient()!;
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<void> {
  if (!isSupabaseServerConfigured()) return;
  const client = getSupabaseServerClient()!;
  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Failed to delete file: ${error.message}`);
}

/**
 * List files in a bucket path.
 */
export async function listFiles(
  bucket: StorageBucket,
  path: string = '',
  opts: { limit?: number; offset?: number } = {},
): Promise<Array<{ name: string; id: string; updated_at: string; metadata: Record<string, unknown> }>> {
  if (!isSupabaseServerConfigured()) return [];
  const client = getSupabaseServerClient()!;
  const { data, error } = await client
    .storage
    .from(bucket)
    .list(path, { limit: opts.limit || 100, offset: opts.offset || 0 });
  if (error) throw new Error(`Failed to list files: ${error.message}`);
  return (data || []).map(f => ({
    name: f.name,
    id: f.id || '',
    updated_at: f.updated_at || '',
    metadata: (f.metadata as Record<string, unknown>) || {},
  }));
}
