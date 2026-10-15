/**
 * Photo Studio - image I/O + geometry.
 *
 * Loading, the (canvas-based) geometric transforms and export/save live here.
 * Geometry is applied with the browser's own scaler so it is high quality and
 * fast; the pixel adjustments then run on the resulting buffer in the worker.
 */

const PREVIEW_MAX = 1600;

const loadHtmlImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = url;
  });

export async function loadImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }
  let source;
  if (typeof createImageBitmap === 'function') {
    try {
      source = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      const url = URL.createObjectURL(file);
      source = await loadHtmlImage(url);
      URL.revokeObjectURL(url);
    }
  } else {
    const url = URL.createObjectURL(file);
    source = await loadHtmlImage(url);
    URL.revokeObjectURL(url);
  }
  return {
    source,
    width: source.width || source.naturalWidth,
    height: source.height || source.naturalHeight,
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

export const imageSize = (source) => ({
  width: source.width || source.naturalWidth,
  height: source.height || source.naturalHeight,
});

/** Oriented (rotated + straightened) full-size bounds. */
export function orientedSize(source, transform) {
  const { width: W, height: H } = imageSize(source);
  const quarter = ((transform.rotate90 % 360) + 360) % 360;
  const swap = quarter === 90 || quarter === 270;
  const rw = swap ? H : W;
  const rh = swap ? W : H;
  const rad = (transform.straighten * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return { width: rw * cos + rh * sin, height: rw * sin + rh * cos };
}

const cropRect = (transform) =>
  transform.crop || { x: 0, y: 0, width: 1, height: 1 };

/** Size of the cropped, oriented image scaled to fit inside `max`. */
export function outputSize(source, transform, max) {
  const oriented = orientedSize(source, transform);
  const c = cropRect(transform);
  const cw = Math.max(1, c.width * oriented.width);
  const ch = Math.max(1, c.height * oriented.height);
  const scale = max ? Math.min(1, max / Math.max(cw, ch)) : 1;
  return { width: Math.max(1, Math.round(cw * scale)), height: Math.max(1, Math.round(ch * scale)) };
}

function drawOriented(ctx, source, transform, ow, oh) {
  const { width: W, height: H } = imageSize(source);
  ctx.save();
  ctx.translate(ow / 2, oh / 2);
  ctx.rotate((transform.straighten * Math.PI) / 180);
  ctx.rotate((((transform.rotate90 % 360) + 360) % 360) * (Math.PI / 180));
  ctx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1);
  ctx.drawImage(source, -W / 2, -H / 2, W, H);
  ctx.restore();
}

/**
 * Rasterise the geometric transform into a fresh canvas sized `out`.
 * `usePreviewMax` clamps to the preview resolution (for on-screen rendering);
 * pass a max of `null`/large for full-resolution export.
 */
export function renderGeometry(source, transform, out, usePreviewMax) {
  const { width: W, height: H } = imageSize(source);
  const oriented = orientedSize(source, transform);
  const c = cropRect(transform);

  const cx = c.x * oriented.width;
  const cy = c.y * oriented.height;
  const cw = Math.max(1, c.width * oriented.width);
  const ch = Math.max(1, c.height * oriented.height);

  let outW;
  let outH;
  if (usePreviewMax) {
    const s = Math.min(1, PREVIEW_MAX / Math.max(cw, ch));
    outW = Math.max(1, Math.round(cw * s));
    outH = Math.max(1, Math.round(ch * s));
  } else {
    const s = out && out.width ? out.width / cw : 1;
    outW = Math.max(1, Math.round(cw * s));
    outH = Math.max(1, Math.round(ch * s));
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const scale = outW / cw;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  drawOriented(ctx, source, transform, oriented.width, oriented.height);
  ctx.restore();
  return canvas;
}

export function readPixels(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function putPixels(canvas, imageData) {
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.putImageData(imageData, 0, 0);
}

export const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))),
      type,
      quality
    );
  });

export const mimeFor = (format) =>
  ({ jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[format] ||
  'image/png');

export const extFor = (mime) =>
  ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime] || 'png');

/**
 * Save a blob. Prefers the Electron main-process save dialog; falls back to a
 * normal browser download when running in a plain browser/dev context.
 */
export async function saveBlob(blob, filename) {
  const api = typeof window !== 'undefined' ? window.electronAPI : null;
  if (api && typeof api.saveImage === 'function') {
    const buffer = await blob.arrayBuffer();
    const ext = filename.split('.').pop();
    const result = await api.saveImage({
      buffer,
      defaultPath: filename,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    });
    return { saved: !!(result && result.success), path: result && result.path };
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return { saved: true, path: filename };
}
