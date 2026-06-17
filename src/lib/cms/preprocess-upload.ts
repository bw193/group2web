'use client';

// Downsize the picked image to a 2000px-wide WebP in the browser before POST.
// Vercel rejects requests above its body-size cap at the edge (no error reaches
// the function), and /api/upload immediately resizes everything down to <=1600px
// wide anyway — shipping the camera original is pure waste. A typical 7-10MB
// phone JPG becomes ~300-500KB after this.
export async function preprocessForUpload(file: File): Promise<File> {
  // SVG/GIF: sharp passes them through server-side; do the same here.
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  const bitmap = await createImageBitmap(file);
  const targetWidth = Math.min(2000, bitmap.width);
  const scale = targetWidth / bitmap.width;
  const targetHeight = Math.round(bitmap.height * scale);

  const useOffscreen = typeof OffscreenCanvas !== 'undefined';
  const canvas: OffscreenCanvas | HTMLCanvasElement = useOffscreen
    ? new OffscreenCanvas(targetWidth, targetHeight)
    : Object.assign(document.createElement('canvas'), {
        width: targetWidth,
        height: targetHeight,
      });

  const ctx = (canvas as OffscreenCanvas).getContext('2d');
  if (!ctx) throw new Error('preprocessForUpload: 2D canvas unavailable');
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close?.();

  const blob = useOffscreen
    ? await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/webp', quality: 0.85 })
    : await new Promise<Blob>((resolve, reject) =>
        (canvas as HTMLCanvasElement).toBlob(
          (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))),
          'image/webp',
          0.85,
        ),
      );

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
}
