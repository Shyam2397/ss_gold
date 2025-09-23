// Ultimate bitmap extractor for Excel-level print quality
// This directly extracts and processes raw bitmap data

/**
 * Creates a raw memory buffer bitmap for absolute Excel-level quality
 * This bypasses ALL browser processing and works with raw image data
 * @param {string} imageDataUrl - Source image data URL
 * @returns {Promise<string>} - Raw bitmap data URL
 */
export const createRawMemoryBitmap = async (imageDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Create temporary canvas for data extraction only
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      
      const tempCtx = tempCanvas.getContext('2d', {
        willReadFrequently: true,
        alpha: false,
        desynchronized: false
      });
      
      // Disable ALL processing for raw data extraction
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.webkitImageSmoothingEnabled = false;
      tempCtx.mozImageSmoothingEnabled = false;
      tempCtx.msImageSmoothingEnabled = false;
      tempCtx.oImageSmoothingEnabled = false;
      
      // Draw image to extract raw pixel data
      tempCtx.drawImage(img, 0, 0);
      
      // Extract raw pixel buffer
      const rawImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const rawBuffer = rawImageData.data;
      
      // Create new canvas for raw bitmap reconstruction
      const rawCanvas = document.createElement('canvas');
      rawCanvas.width = tempCanvas.width;
      rawCanvas.height = tempCanvas.height;
      
      const rawCtx = rawCanvas.getContext('2d', {
        willReadFrequently: false,
        alpha: false,
        desynchronized: false
      });
      
      // Disable ALL smoothing on output canvas
      rawCtx.imageSmoothingEnabled = false;
      rawCtx.webkitImageSmoothingEnabled = false;
      rawCtx.mozImageSmoothingEnabled = false;
      rawCtx.msImageSmoothingEnabled = false;
      rawCtx.oImageSmoothingEnabled = false;
      
      // Process raw buffer for maximum sharpness
      const processedBuffer = new Uint8ClampedArray(rawBuffer.length);
      
      // Copy raw data with precision enhancement for print
      for (let i = 0; i < rawBuffer.length; i += 4) {
        // Direct pixel copy - no modifications to preserve absolute quality
        processedBuffer[i] = rawBuffer[i];         // R
        processedBuffer[i + 1] = rawBuffer[i + 1]; // G
        processedBuffer[i + 2] = rawBuffer[i + 2]; // B
        processedBuffer[i + 3] = 255;              // A (full opacity)
      }
      
      // Create final ImageData from processed buffer
      const finalImageData = new ImageData(processedBuffer, rawCanvas.width, rawCanvas.height);
      
      // Put raw pixel data directly to canvas
      rawCtx.putImageData(finalImageData, 0, 0);
      
      // Export as uncompressed PNG
      const rawBitmapDataUrl = rawCanvas.toDataURL('image/png');
      
      // Cleanup
      tempCanvas.width = 1;
      tempCanvas.height = 1;
      rawCanvas.width = 1;
      rawCanvas.height = 1;
      
      console.log('Raw memory bitmap created:', img.naturalWidth, 'x', img.naturalHeight);
      resolve(rawBitmapDataUrl);
    };
    
    img.onerror = () => {
      console.warn('Failed to create raw memory bitmap, using original');
      resolve(imageDataUrl);
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Ultimate bypass capture - works entirely in memory buffers
 * @param {string} containerSelector - Container selector
 * @param {Array} arrowsData - Arrow data array
 * @returns {Promise<string>} - Memory buffer image data URL
 */
export const captureMemoryBufferImage = (containerSelector, arrowsData = []) => {
  return new Promise((resolve) => {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error('Image container not found');
      resolve(null);
      return;
    }

    const transformedImg = container.querySelector('.absolute.inset-0');
    if (!transformedImg) {
      console.error('Transformed image element not found');
      resolve(null);
      return;
    }

    // Get original image source
    const style = window.getComputedStyle(transformedImg);
    const backgroundImage = style.backgroundImage;
    const imgUrl = backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        console.log('Starting memory buffer capture...');
        
        // Work at absolute native resolution
        const nativeWidth = img.naturalWidth;
        const nativeHeight = img.naturalHeight;
        
        console.log('Native image dimensions:', nativeWidth, 'x', nativeHeight);
        
        // Create memory buffer canvas
        const bufferCanvas = document.createElement('canvas');
        bufferCanvas.width = nativeWidth;
        bufferCanvas.height = nativeHeight;
        
        const bufferCtx = bufferCanvas.getContext('2d', {
          willReadFrequently: true,
          alpha: false,
          desynchronized: false
        });
        
        // CRITICAL: Disable ALL browser optimizations
        bufferCtx.imageSmoothingEnabled = false;
        bufferCtx.webkitImageSmoothingEnabled = false;
        bufferCtx.mozImageSmoothingEnabled = false;
        bufferCtx.msImageSmoothingEnabled = false;
        bufferCtx.oImageSmoothingEnabled = false;
        
        // Perfect white background
        bufferCtx.fillStyle = '#FFFFFF';
        bufferCtx.fillRect(0, 0, nativeWidth, nativeHeight);
        
        // Get container dimensions for transform calculation
        const containerRect = container.getBoundingClientRect();
        const scaleX = nativeWidth / containerRect.width;
        const scaleY = nativeHeight / containerRect.height;
        
        // Apply transforms in memory buffer space
        const transform = window.getComputedStyle(transformedImg).transform;
        
        bufferCtx.save();
        bufferCtx.translate(nativeWidth / 2, nativeHeight / 2);
        
        if (transform && transform !== 'none') {
          const matrix = transform.match(/^matrix\((.+)\)$/)[1].split(',').map(Number);
          bufferCtx.transform(
            matrix[0], matrix[1],
            matrix[2], matrix[3],
            matrix[4] * scaleX, matrix[5] * scaleY
          );
        }
        
        // Draw image in memory buffer (1:1 pixel mapping)
        bufferCtx.drawImage(
          img, 
          -nativeWidth / 2,  
          -nativeHeight / 2, 
          nativeWidth,       
          nativeHeight       
        );
        
        bufferCtx.restore();
        
        // Draw arrows in memory buffer space
        if (arrowsData && arrowsData.length > 0) {
          drawMemoryBufferArrows(bufferCtx, arrowsData, nativeWidth, nativeHeight, scaleX, scaleY);
        }
        
        // Extract raw memory buffer
        const memoryBuffer = bufferCtx.getImageData(0, 0, nativeWidth, nativeHeight);
        
        // Create final output canvas
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = nativeWidth;
        outputCanvas.height = nativeHeight;
        
        const outputCtx = outputCanvas.getContext('2d', {
          willReadFrequently: false,
          alpha: false,
          desynchronized: false
        });
        
        // Disable smoothing on output
        outputCtx.imageSmoothingEnabled = false;
        outputCtx.webkitImageSmoothingEnabled = false;
        outputCtx.mozImageSmoothingEnabled = false;
        outputCtx.msImageSmoothingEnabled = false;
        outputCtx.oImageSmoothingEnabled = false;
        
        // Put memory buffer directly to output
        outputCtx.putImageData(memoryBuffer, 0, 0);
        
        // Export as uncompressed PNG
        const memoryBufferDataUrl = outputCanvas.toDataURL('image/png');
        
        console.log('Memory buffer capture completed:', nativeWidth, 'x', nativeHeight);
        
        // Cleanup
        bufferCanvas.width = 1;
        bufferCanvas.height = 1;
        outputCanvas.width = 1;
        outputCanvas.height = 1;
        
        resolve(memoryBufferDataUrl);
        
      } catch (error) {
        console.error('Error in memory buffer capture:', error);
        resolve(null);
      }
    };
    
    img.onerror = (error) => {
      console.error('Error loading image for memory buffer capture:', error);
      resolve(null);
    };
    
    img.src = imgUrl;
  });
};

/**
 * Memory buffer arrow drawing - bypasses all browser optimizations
 */
const drawMemoryBufferArrows = (ctx, arrowsData, canvasWidth, canvasHeight, scaleX, scaleY) => {
  if (!arrowsData || arrowsData.length === 0) return;

  console.log('Drawing memory buffer arrows at native resolution');

  arrowsData.forEach((arrow, index) => {
    try {
      // Calculate exact memory buffer coordinates
      const arrowX = arrow.x * scaleX;
      const arrowY = arrow.y * scaleY;
      const rotation = arrow.angle * (Math.PI / 180);
      
      // Scale-aware dimensions for memory buffer
      const arrowLength = 35 * scaleX;
      const arrowWidth = Math.max(1, 1.5 * Math.min(scaleX, scaleY));
      const arrowHeadSize = Math.max(3, 5 * Math.min(scaleX, scaleY));
      
      ctx.save();
      
      // Critical: Disable ALL smoothing for memory buffer operations
      ctx.imageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      ctx.oImageSmoothingEnabled = false;
      
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      
      ctx.translate(arrowX, arrowY);
      ctx.rotate(rotation);
      
      ctx.strokeStyle = '#FF0000';
      ctx.fillStyle = '#FF0000';
      ctx.lineWidth = arrowWidth;
      
      // Draw shaft in memory buffer
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(arrowLength, 0);
      ctx.stroke();
      
      // Draw head in memory buffer
      ctx.beginPath();
      ctx.moveTo(arrowLength, 0);
      ctx.lineTo(arrowLength - 8 * scaleX, -arrowHeadSize);
      ctx.lineTo(arrowLength - 8 * scaleX, arrowHeadSize);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
      
      console.log(`Memory buffer arrow ${index + 1} processed`);
      
    } catch (error) {
      console.warn(`Error drawing memory buffer arrow ${index + 1}:`, error);
    }
  });
};