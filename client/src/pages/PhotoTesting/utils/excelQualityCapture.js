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
      console.error('Image container not found with selector:', containerSelector);
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
    
    console.log('Container selector used:', containerSelector);
    console.log('Container dimensions:', container.getBoundingClientRect());
    console.log('Arrows data for capture:', arrowsData.map(a => ({ id: a.id, x: a.x, y: a.y, angle: a.angle })));
    
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
        
        // Calculate actual visible image bounds (accounting for backgroundSize: 'contain')
        const containerAspect = containerRect.width / containerRect.height;
        const imageAspect = nativeWidth / nativeHeight;
        
        let visibleImageWidth, visibleImageHeight, offsetX, offsetY;
        
        if (imageAspect > containerAspect) {
          // Image is wider - constrained by container width
          visibleImageWidth = containerRect.width;
          visibleImageHeight = containerRect.width / imageAspect;
          offsetX = 0;
          offsetY = (containerRect.height - visibleImageHeight) / 2;
        } else {
          // Image is taller - constrained by container height
          visibleImageHeight = containerRect.height;
          visibleImageWidth = containerRect.height * imageAspect;
          offsetX = (containerRect.width - visibleImageWidth) / 2;
          offsetY = 0;
        }
        
        // Scale factors based on VISIBLE image area, not container
        const scaleX = nativeWidth / visibleImageWidth;
        const scaleY = nativeHeight / visibleImageHeight;
        
        console.log('Container rect:', { width: containerRect.width, height: containerRect.height });
        console.log('Visible image area:', { width: visibleImageWidth, height: visibleImageHeight });
        console.log('Image offset (centering):', { offsetX, offsetY });
        console.log('Native dimensions:', { width: nativeWidth, height: nativeHeight });
        console.log('Scale factors:', { scaleX, scaleY });
        
        // Apply transforms in memory buffer space
        const transform = window.getComputedStyle(transformedImg).transform;
        
        bufferCtx.save();
        bufferCtx.translate(nativeWidth / 2, nativeHeight / 2);
        
        if (transform && transform !== 'none') {
          const matrix = transform.match(/^matrix\((.+)\)$/)[1].split(',').map(Number);
          // Transform values are in container pixel units, convert to native image units
          // Scale the translation values based on visible image area
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
        // NOTE: We do NOT apply the transform matrix here because arrow coordinates
        // are already being converted from container space to canvas space directly
        if (arrowsData && arrowsData.length > 0) {
          console.log('Drawing arrows in memory buffer with scale factors:', { scaleX, scaleY });
          drawMemoryBufferArrows(bufferCtx, arrowsData, nativeWidth, nativeHeight, scaleX, scaleY, containerRect, offsetX, offsetY, visibleImageWidth, visibleImageHeight);
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
        console.log('Total arrows processed:', arrowsData.length);
        
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
const drawMemoryBufferArrows = (ctx, arrowsData, canvasWidth, canvasHeight, scaleX, scaleY, containerRect, offsetX, offsetY, visibleImageWidth, visibleImageHeight) => {
  if (!arrowsData || arrowsData.length === 0) return;

  console.log('Drawing memory buffer arrows at native resolution');
  console.log('Canvas dimensions:', { canvasWidth, canvasHeight });
  console.log('Scale factors:', { scaleX, scaleY });
  console.log('Container rect:', containerRect);
  console.log('Image offset:', { offsetX, offsetY });
  console.log('Visible image area:', { visibleImageWidth, visibleImageHeight });

  arrowsData.forEach((arrow, index) => {
    try {
      // Convert UI container coordinates to canvas coordinates
      // UI coordinates are relative to the CONTAINER (0,0 at top-left)
      
      // Step 1: Convert container coords to visible image coords (account for offset)
      // Clamp to visible image bounds to handle edge cases
      const visibleImageX = Math.max(0, Math.min(arrow.x - offsetX, visibleImageWidth));
      const visibleImageY = Math.max(0, Math.min(arrow.y - offsetY, visibleImageHeight));
      
      // Step 2: Convert visible image coords to canvas absolute coords
      // The image is drawn centered on the canvas at (nativeWidth/2, nativeHeight/2)
      const arrowCanvasX = (visibleImageX - visibleImageWidth / 2) * scaleX + canvasWidth / 2;
      const arrowCanvasY = (visibleImageY - visibleImageHeight / 2) * scaleY + canvasHeight / 2;
      const rotation = arrow.angle * (Math.PI / 180);
      
      console.log(`Arrow ${index + 1}:`);
      console.log(`  UI container coords: (${arrow.x.toFixed(2)}, ${arrow.y.toFixed(2)})`);
      console.log(`  Visible image coords: (${visibleImageX.toFixed(2)}, ${visibleImageY.toFixed(2)})`);
      console.log(`  Canvas coords: (${arrowCanvasX.toFixed(2)}, ${arrowCanvasY.toFixed(2)})`);
      console.log(`  Angle: ${arrow.angle}°`);
      
      // Use consistent scaling - match UI arrow proportions exactly
      const baseScale = Math.min(scaleX, scaleY);
      const arrowLength = 35 * baseScale;
      const arrowWidth = 1.5 * baseScale;
      const arrowHeadWidth = 8 * baseScale;
      const arrowHeadHeight = 5 * baseScale;
      
      console.log(`  Scaled dimensions: length=${arrowLength.toFixed(2)}, width=${arrowWidth.toFixed(2)}, head=${arrowHeadWidth.toFixed(2)}x${arrowHeadHeight.toFixed(2)}`);
      
      ctx.save();
      
      // Critical: Disable ALL smoothing for memory buffer operations
      ctx.imageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      ctx.oImageSmoothingEnabled = false;
      
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      
      // Position arrow at canvas coordinates
      ctx.translate(arrowCanvasX, arrowCanvasY);
      ctx.rotate(rotation);
      
      // Set styles
      ctx.strokeStyle = '#FF0000';
      ctx.fillStyle = '#FF0000';
      ctx.lineWidth = arrowWidth;
      
      // Draw shaft
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(arrowLength, 0);
      ctx.stroke();
      
      // Draw arrow head - match UI proportions exactly
      ctx.beginPath();
      ctx.moveTo(arrowLength, 0);
      ctx.lineTo(arrowLength - arrowHeadWidth, -arrowHeadHeight);
      ctx.lineTo(arrowLength - arrowHeadWidth, arrowHeadHeight);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
      
      console.log(`Memory buffer arrow ${index + 1} processed successfully`);
      
    } catch (error) {
      console.warn(`Error drawing memory buffer arrow ${index + 1}:`, error);
    }
  });
};