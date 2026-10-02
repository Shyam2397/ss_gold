/**
 * Turns a picked image file into a small data URL suitable for the users table.
 * The server only accepts `data:image/...` strings up to 400 KB, so the picture
 * is downscaled and re-encoded before it is ever sent.
 */

export const PROFILE_IMAGE_SIZE = 256;
export const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

const MAX_ENCODED_LENGTH = 380 * 1024;

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file does not look like an image.'));
    img.src = src;
  });

/** Square centre crop so every avatar lines up in the sidebar and user lists. */
const drawSquare = (ctx, img, size) => {
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
};

const encode = (canvas, type, quality) => canvas.toDataURL(type, quality);

/**
 * Step the JPEG quality down until the data URL fits, so a busy photo cannot
 * silently blow past the server limit.
 */
const shrinkUntilFits = (canvas) => {
  let result = encode(canvas, 'image/jpeg', 0.85);
  let quality = 0.85;

  while (result.length > MAX_ENCODED_LENGTH && quality > 0.35) {
    quality -= 0.15;
    result = encode(canvas, 'image/jpeg', quality);
  }

  return result;
};

export const fileToProfileImage = async (file) => {
  if (!file) {
    throw new Error('Please choose an image file.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (PNG, JPG or WEBP).');
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('That image is too large. Please pick one under 8 MB.');
  }

  const dataUrl = await readFile(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = PROFILE_IMAGE_SIZE;
  canvas.height = PROFILE_IMAGE_SIZE;

  const ctx = canvas.getContext('2d');
  // JPEG has no alpha channel, so flatten onto white first
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PROFILE_IMAGE_SIZE, PROFILE_IMAGE_SIZE);
  drawSquare(ctx, img, PROFILE_IMAGE_SIZE);

  const encoded = shrinkUntilFits(canvas);

  if (encoded.length > MAX_ENCODED_LENGTH) {
    throw new Error('That image could not be compressed small enough. Try another one.');
  }

  return encoded;
};
