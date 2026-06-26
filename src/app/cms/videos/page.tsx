'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit2, Plus, Search, Trash2, Video } from 'lucide-react';
import { getUploadUrl } from '@/lib/utils';

interface CmsVideoRow {
  id: string;
  slug: string;
  status: 'draft' | 'published';
  sourceType: 'embed' | 'upload' | 'direct';
  thumbnailUrl: string | null;
  publishedAt: string | null;
  titleText: string;
  excerptText: string;
}

export default function VideosListPage() {
  const [videos, setVideos] = useState<CmsVideoRow[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await fetch('/api/videos');
    if (res.ok) setVideos(await res.json());
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this video?')) return;
    await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    fetchData();
  }

  const filtered = videos.filter((video) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      video.titleText.toLowerCase().includes(q) ||
      video.slug.toLowerCase().includes(q) ||
      video.excerptText.toLowerCase().includes(q);
    const matchStatus = !status || video.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Videos</h1>
        <Link href="/cms/videos/new" className="btn-primary text-sm">
          <Plus size={16} className="mr-1" /> Add Video
        </Link>
      </div>

      <div className="cms-card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field md:w-44">
            <option value="">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="cms-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 w-16">Thumb</th>
              <th className="text-left py-3">Title / Description</th>
              <th className="text-left py-3">Source</th>
              <th className="text-left py-3">Status</th>
              <th className="text-left py-3">Published</th>
              <th className="text-left py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((video) => (
              <tr key={video.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2">
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getUploadUrl(video.thumbnailUrl)} alt="" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                      <Video size={18} />
                    </div>
                  )}
                </td>
                <td className="py-2 font-medium max-w-md">
                  <span className="line-clamp-2">{video.titleText}</span>
                  {video.excerptText && (
                    <span className="block text-xs text-text-secondary font-normal mt-1 line-clamp-2">{video.excerptText}</span>
                  )}
                  <span className="block text-xs text-text-secondary font-normal mt-0.5">/{video.slug}</span>
                </td>
                <td className="py-2 text-text-secondary capitalize">{video.sourceType}</td>
                <td className="py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      video.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {video.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="py-2 text-text-secondary whitespace-nowrap">{video.publishedAt?.slice(0, 10) || '-'}</td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <Link href={`/cms/videos/${video.id}`} className="p-2 hover:bg-gray-100 rounded">
                      <Edit2 size={16} />
                    </Link>
                    <button onClick={() => handleDelete(video.id)} className="p-2 hover:bg-red-50 text-red-500 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-text-secondary py-8">No videos found.</p>}
      </div>
    </div>
  );
}
