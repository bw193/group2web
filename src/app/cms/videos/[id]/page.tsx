'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, Loader2, Upload, Wand2, X } from 'lucide-react';
import { buildEmbedUrl, getYouTubeThumbnail } from '@/lib/video-utils';
import { getUploadUrl, slugify } from '@/lib/utils';

type SourceType = 'embed' | 'upload' | 'direct';
type VideoStatus = 'draft' | 'published';

interface SignResponse {
  bucket: string;
  path: string;
  publicUrl: string;
  signedUrl: string;
  cacheControl: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function en(value: any): string {
  return value?.en || '';
}

async function uploadToSignedUrl(
  file: File,
  kind: 'video' | 'thumbnail',
  slug: string,
  onProgress: (progress: number) => void,
): Promise<string> {
  const signRes = await fetch('/api/upload/video/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      slug,
    }),
  });
  if (!signRes.ok) {
    const data = await signRes.json().catch(() => null);
    throw new Error(data?.error || 'Could not create upload token');
  }
  const signed = (await signRes.json()) as SignResponse;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('cacheControl', signed.cacheControl || '31536000');
    formData.append('', file, file.name);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      let message = `Upload failed with status ${xhr.status}`;
      try {
        const data = JSON.parse(xhr.responseText);
        message = data?.message || data?.error || message;
      } catch {}
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error('Upload failed while sending the file to Supabase Storage'));
    xhr.open('PUT', signed.signedUrl);
    xhr.send(formData);
  });

  return signed.publicUrl;
}

async function readVideoMeta(file: File): Promise<{ duration: number | null; thumbnail: File | null }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Could not read video metadata'));
    });

    const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : null;
    const target = Math.min(Math.max((video.duration || 1) * 0.2, 0.5), Math.max(video.duration || 1, 0.5));
    video.currentTime = target;

    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      setTimeout(resolve, 1200);
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { duration, thumbnail: null };
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    return {
      duration,
      thumbnail: blob ? new File([blob], `${slugify(file.name.replace(/\.[^.]+$/, '')) || 'video'}-thumb.jpg`, { type: 'image/jpeg' }) : null,
    };
  } catch {
    return { duration: null, thumbnail: null };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function VideoEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<'' | 'video' | 'thumbnail'>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    status: 'draft' as VideoStatus,
    sourceType: 'embed' as SourceType,
    videoUrl: '',
    embedUrl: '',
    thumbnailUrl: '',
    description: '',
    publishedAt: today(),
  });

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/videos/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setForm({
            title: en(data.title),
            slug: data.slug || '',
            status: data.status || 'draft',
            sourceType: data.sourceType || 'embed',
            videoUrl: data.videoUrl || '',
            embedUrl: data.embedUrl || '',
            thumbnailUrl: data.thumbnailUrl || '',
            description: en(data.excerpt),
            publishedAt: (data.publishedAt || '').slice(0, 10) || today(),
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('video');
    setUploadProgress(0);
    setError('');
    try {
      const slug = form.slug || slugify(form.title) || 'video';
      const [publicUrl, meta] = await Promise.all([
        uploadToSignedUrl(file, 'video', slug, setUploadProgress),
        readVideoMeta(file),
      ]);
      setForm((prev) => ({
        ...prev,
        sourceType: 'upload',
        videoUrl: publicUrl,
      }));
      if (meta.thumbnail && !form.thumbnailUrl) {
        setUploading('thumbnail');
        const thumbUrl = await uploadToSignedUrl(meta.thumbnail, 'thumbnail', slug, setUploadProgress);
        setForm((prev) => ({ ...prev, thumbnailUrl: thumbUrl }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed');
    } finally {
      setUploading('');
      setUploadProgress(0);
      e.target.value = '';
    }
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('thumbnail');
    setUploadProgress(0);
    setError('');
    try {
      const publicUrl = await uploadToSignedUrl(file, 'thumbnail', form.slug || slugify(form.title) || 'video', setUploadProgress);
      setForm((prev) => ({ ...prev, thumbnailUrl: publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thumbnail upload failed');
    } finally {
      setUploading('');
      setUploadProgress(0);
      e.target.value = '';
    }
  }

  async function deriveEmbed() {
    const embedUrl = buildEmbedUrl(form.videoUrl);
    const youtubeThumb = getYouTubeThumbnail(form.videoUrl);
    let thumbnailUrl = youtubeThumb || form.thumbnailUrl;
    if (!thumbnailUrl && form.videoUrl.includes('vimeo.com')) {
      try {
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(form.videoUrl)}`);
        if (res.ok) {
          const data = await res.json();
          thumbnailUrl = data.thumbnail_url || '';
        }
      } catch {}
    }
    setForm((prev) => ({ ...prev, sourceType: 'embed', embedUrl, thumbnailUrl }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      slug: form.slug || slugify(form.title),
      status: form.status,
      sourceType: form.sourceType,
      videoUrl: form.videoUrl || null,
      embedUrl: form.embedUrl || null,
      thumbnailUrl: form.thumbnailUrl || null,
      category: null,
      tags: [],
      durationSeconds: null,
      title: { en: form.title },
      excerpt: { en: form.description },
      body: {},
      seoTitle: {},
      seoDescription: {},
      publishedAt: form.status === 'published' ? form.publishedAt || today() : form.publishedAt || null,
    };

    const res = await fetch(isNew ? '/api/videos' : `/api/videos/${id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/cms/videos');
      return;
    }
    const data = await res.json().catch(() => null);
    setError(data?.error || 'Save failed');
    setSaving(false);
  }

  if (loading) return <div className="text-text-secondary">Loading...</div>;

  const isBusy = Boolean(uploading || saving);

  return (
    <div>
      <Link href="/cms/videos" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft size={16} /> Back to Videos
      </Link>

      <h1 className="text-2xl font-heading font-bold mb-6">{isNew ? 'Add Video' : 'Edit Video'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-4">Video</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">URL Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as VideoStatus })} className="input-field">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Publish date</label>
              <input type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} className="input-field" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5">Description *</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              placeholder="Describe what this video shows. This text is rendered on the public page and used for Google snippets."
            />
          </div>
        </div>

        <div className="cms-card">
          <h2 className="text-lg font-semibold mb-4">Source</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {(['embed', 'upload', 'direct'] as SourceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, sourceType: type })}
                className={`border rounded px-4 py-3 text-left text-sm capitalize ${
                  form.sourceType === type ? 'border-accent-navy bg-blue-50 text-accent-navy' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {form.sourceType === 'upload' && (
            <div className="mt-5">
              <label className="w-full max-w-md aspect-video rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent-navy transition-colors">
                {uploading === 'video' ? <Loader2 size={24} className="animate-spin text-gray-400" /> : <Upload size={24} className="text-gray-400" />}
                <span className="text-sm text-gray-500 mt-2">{uploading === 'video' ? `Uploading ${uploadProgress}%` : 'Upload MP4/WebM/MOV'}</span>
                <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleVideoUpload} className="hidden" />
              </label>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">{form.sourceType === 'embed' ? 'External video URL' : 'Video URL'}</label>
              <input
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                className="input-field"
                placeholder={form.sourceType === 'embed' ? 'YouTube or Vimeo URL' : 'https://.../video.mp4'}
              />
            </div>
            {form.sourceType === 'embed' && (
              <button type="button" onClick={deriveEmbed} className="btn-outline self-end">
                <Wand2 size={15} className="mr-1" /> Derive
              </button>
            )}
          </div>

          {form.sourceType === 'embed' && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5">Embed URL</label>
              <input value={form.embedUrl} onChange={(e) => setForm({ ...form, embedUrl: e.target.value })} className="input-field" />
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1.5">Thumbnail URL</label>
            <input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} className="input-field" />
          </div>

          <div className="mt-5 flex flex-wrap gap-4 items-start">
            {form.thumbnailUrl && (
              <div className="relative w-48 aspect-video rounded overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getUploadUrl(form.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, thumbnailUrl: '' }))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <label className="w-48 aspect-video rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-accent-navy transition-colors">
              {uploading === 'thumbnail' ? <Loader2 size={20} className="animate-spin text-gray-400" /> : <ImagePlus size={20} className="text-gray-400" />}
              <span className="text-xs text-gray-400 mt-1">{uploading === 'thumbnail' ? `Uploading ${uploadProgress}%` : 'Upload thumbnail'}</span>
              <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={isBusy} className="btn-primary">
            {saving ? 'Saving...' : isNew ? 'Create Video' : 'Update Video'}
          </button>
          <Link href="/cms/videos" className="btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
