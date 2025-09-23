/**
 * Print-specific image optimization utilities
 * Preserves image quality for high-DPI print output with pixel-perfect precision
 */

/**
 * Creates a pixel-perfect print-ready image with no quality loss
 * @param {string} imageDataUrl - Base64 image data URL
 * @returns {Promise<string>} - Pixel-perfect image data URL
 */
export const createPixelPerfectPrint = async (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas at native image resolution (no scaling)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', {
        willReadFrequently: false,
        alpha: false,
        desynchronized: false
      });
      
      // Use exact native dimensions for pixel-perfect output
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Disable all smoothing and interpolation
      ctx.imageSmoothingEnabled = false;
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image at native resolution (1:1 pixel mapping)
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
      
      // Export as uncompressed PNG for pixel-perfect quality
      const pixelPerfectDataUrl = canvas.toDataURL('image/png', 1.0);
      
      // Clean up
      canvas.width = 1;
      canvas.height = 1;
      
      resolve(pixelPerfectDataUrl);
    };
    
    img.onerror = () => {
      console.warn('Failed to create pixel-perfect image, using original');
      resolve(imageDataUrl);
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Creates a direct bitmap image for print with zero processing artifacts
 * @param {string} imageDataUrl - Base64 image data URL
 * @returns {Promise<string>} - Direct bitmap data URL
 */
export const createDirectBitmap = async (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas exactly matching image dimensions
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      const ctx = canvas.getContext('2d', {
        willReadFrequently: false,
        alpha: false,
        desynchronized: false
      });
      
      // Completely disable any form of image processing
      ctx.imageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      ctx.oImageSmoothingEnabled = false;
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Direct 1:1 pixel copy with no interpolation
      ctx.drawImage(img, 0, 0);
      
      // Get raw image data and create new canvas to ensure no artifacts
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Create final output canvas
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const outputCtx = outputCanvas.getContext('2d');
      
      // Disable smoothing on output canvas too
      outputCtx.imageSmoothingEnabled = false;
      outputCtx.webkitImageSmoothingEnabled = false;
      outputCtx.mozImageSmoothingEnabled = false;
      outputCtx.msImageSmoothingEnabled = false;
      outputCtx.oImageSmoothingEnabled = false;
      
      // Put raw pixel data directly
      outputCtx.putImageData(imageData, 0, 0);
      
      // Export as PNG with maximum compression but lossless quality
      const bitmapDataUrl = outputCanvas.toDataURL('image/png');
      
      // Clean up
      canvas.width = 1;
      canvas.height = 1;
      outputCanvas.width = 1;
      outputCanvas.height = 1;
      
      resolve(bitmapDataUrl);
    };
    
    img.onerror = () => {
      console.warn('Failed to create direct bitmap, using original');
      resolve(imageDataUrl);
    };
    
    img.src = imageDataUrl;
  });
};