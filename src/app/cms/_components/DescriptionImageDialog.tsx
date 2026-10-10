'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { preprocessForUpload } from '@/lib/cms/preprocess-upload';
import {
  MAX_DESCRIPTION_CHARS,
  MIN_DESCRIPTION_WORDS,
  checkDescription,
  countWords,
  type DescriptionIssue,
  type UsedDescription,
} from '@/lib/description-images';
import { getUploadUrl } from '@/lib/utils';
import { useT } from '../_lib/i18n';
import type { CmsKey } from '../_lib/translations';
import type { DescriptionImageAttrs } from './DescriptionImage';

type Translate = (key: CmsKey, vars?: Record<string, string | number>) => string;

// Vercel rejects request bodies over about 4.5 MB; this leaves room for the
// rest of the form.
const DIRECT_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export function descriptionIssueText(t: Translate, issue: DescriptionIssue): string {
  switch (issue.kind) {
    case 'missing':
      return t('rt.image.err.missing');
    case 'tooShort':
      return t('rt.image.err.tooShort', { min: MIN_DESCRIPTION_WORDS });
    case 'tooLong':
      return t('rt.image.err.tooLong', { max: MAX_DESCRIPTION_CHARS });
    case 'repeatedHere':
      return t('rt.image.err.repeatedHere');
    case 'usedElsewhere':
      return t('rt.image.err.usedElsewhere', { name: issue.productName });
  }
}

function naturalSize(src: string): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null });
    img.onerror = () => resolve({ width: null, height: null });
    img.src = src;
  });
}

type Props = {
  /** The photo whose description is being changed; null to add a new photo. */
  initial: DescriptionImageAttrs | null;
  /** Names the stored file after the product, like the gallery uploads. */
  uploadSlug: string;
  /** Descriptions of the other photos in this product description. */
  others: readonly string[];
  usedElsewhere: readonly UsedDescription[];
  onSubmit: (attrs: DescriptionImageAttrs) => void;
  onClose: () => void;
};

export default function DescriptionImageDialog({
  initial,
  uploadSlug,
  others,
  usedElsewhere,
  onSubmit,
  onClose,
}: Props) {
  const { t } = useT();
  const [photo, setPhoto] = useState<Omit<DescriptionImageAttrs, 'description'> | null>(
    initial ? { src: initial.src, width: initial.width, height: initial.height } : null,
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  // Errors stay quiet until staff have typed something, apart from on edit.
  const [touched, setTouched] = useState(initial !== null);
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Alt text and captions are one line.
  const text = description.replace(/\s+/g, ' ').trim();
  const issue = checkDescription(text, { others, usedElsewhere });
  const canSubmit = photo !== null && !uploading && issue === null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (initial) textareaRef.current?.focus();
  }, [initial]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadFailed(false);
    try {
      const fd = new FormData();
      // /api/upload compresses every photo (WebP 80%). Files that fit under
      // Vercel's request limit go up untouched, so they are compressed once and
      // fine text in infographics stays sharp; only bigger ones (phone photos)
      // are shrunk here first (<=2000px, WebP 85%).
      fd.append('file', file.size <= DIRECT_UPLOAD_MAX_BYTES ? file : await preprocessForUpload(file));
      fd.append('folder', 'products');
      fd.append('slug', uploadSlug);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Upload failed with HTTP ${res.status}`);
      const data = (await res.json()) as { url: string };
      const src = getUploadUrl(data.url);
      setPhoto({ src, ...(await naturalSize(src)) });
      textareaRef.current?.focus();
    } catch {
      setUploadFailed(true);
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!photo || !canSubmit) return;
    onSubmit({ ...photo, description: text });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rt-image-dialog-title"
    >
      <div className="flex max-h-full w-full max-w-xl flex-col rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="rt-image-dialog-title" className="text-lg font-semibold">
            {initial ? t('rt.image.titleEdit') : t('rt.image.titleInsert')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.cancel')}
            className="p-1 text-gray-400 transition-colors hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          {photo ? (
            <div className="rounded border border-gray-200 bg-gray-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.src} alt="" className="mx-auto max-h-60 object-contain" />
              {!initial && (
                <label className="mt-2 block cursor-pointer text-center text-sm text-accent-navy hover:underline">
                  {uploading ? t('rt.image.uploading') : t('rt.image.replace')}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFile}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          ) : (
            <label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-1.5 rounded border-2 border-dashed border-gray-300 text-gray-500 transition-colors hover:border-accent-navy">
              {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
              <span className="text-sm font-medium">
                {uploading ? t('rt.image.uploading') : t('rt.image.choose')}
              </span>
              <span className="text-xs text-gray-400">{t('rt.image.chooseHint')}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFile}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
          {uploadFailed && <p className="text-sm text-red-600">{t('rt.image.uploadFailed')}</p>}

          <div>
            <label htmlFor="rt-image-description" className="mb-1.5 block text-sm font-medium">
              {t('rt.image.descLabel')}
            </label>
            <p className="mb-2 text-xs text-text-secondary">
              {t('rt.image.descHint', { min: MIN_DESCRIPTION_WORDS })}
            </p>
            <textarea
              id="rt-image-description"
              ref={textareaRef}
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setTouched(true);
              }}
              placeholder={t('rt.image.descPlaceholder')}
              aria-invalid={touched && issue !== null}
              aria-describedby="rt-image-description-status"
              className="input-field-boxed resize-y"
            />
            <div id="rt-image-description-status" className="mt-1.5 flex items-start justify-between gap-4 text-xs">
              <span className="text-red-600">{touched && issue ? descriptionIssueText(t, issue) : ''}</span>
              <span className="whitespace-nowrap tabular-nums text-text-secondary">
                {t('rt.image.count', {
                  words: countWords(text),
                  min: MIN_DESCRIPTION_WORDS,
                  chars: text.length,
                  max: MAX_DESCRIPTION_CHARS,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} className="btn-outline">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={submit} disabled={!canSubmit} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
            {initial ? t('rt.image.save') : t('rt.image.insert')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
