// Helper function to draw arrows on canvas using exact state data
const drawArrows = (ctx, arrowsData, containerWidth, containerHeight) => {
  if (!arrowsData || arrowsData.length === 0) {
    console.log('No arrows data provided for drawing');
    return;
  }

  console.log('Drawing arrows with data:', arrowsData);
  console.log('Container dimensions:', { containerWidth, containerHeight });
  console.log('Canvas context transform before drawing arrows:');
  console.log('Current transform matrix:', ctx.getTransform());

  arrowsData.forEach((arrow, index) => {
    try {
      // Use exact arrow state data (x, y, angle) instead of DOM positioning
      const arrowX = arrow.x;
      const arrowY = arrow.y;
      const rotation = arrow.angle * (Math.PI / 180); // Convert degrees to radians
      
      console.log(`Arrow ${index + 1} - Position: (${arrowX}, ${arrowY}), Angle: ${arrow.angle}°`);
      
      // Save context state
      ctx.save();
      
      // Set basic quality rendering settings to match UI
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.lineCap = 'butt';                   // Match UI sharp ends
      ctx.lineJoin = 'miter';                 // Match UI sharp corners
      ctx.miterLimit = 10;
      
      // Move to exact arrow position from state (no sub-pixel adjustments)
      ctx.translate(arrowX, arrowY);
      
      // Apply rotation from state
      ctx.rotate(rotation);
      
      // Enhanced arrow drawing properties to match UI exactly
      ctx.strokeStyle = 'red';        // Match UI backgroundColor: 'red'
      ctx.fillStyle = 'red';          // Match UI borderLeft color
      ctx.lineWidth = 1.5;            // Match UI height: '1.5px'
      
      // Remove enhanced effects to match simple UI rendering
      // ctx.shadowColor = 'rgba(220, 38, 38, 0.2)';
      // ctx.shadowBlur = 0.5;
      // ctx.shadowOffsetX = 0;
      // ctx.shadowOffsetY = 0;
      
      // Draw arrow shaft to match UI dimensions exactly
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(35, 0);              // Match UI width: '35px'
      ctx.stroke();
      
      // Remove shadow reset since no shadow is used
      // ctx.shadowColor = 'transparent';
      
      // Draw arrowhead to match UI CSS border triangle exactly
      ctx.beginPath();
      ctx.moveTo(35, 0);              // Arrow tip
      ctx.lineTo(27, -5);             // Top wing (matches UI borderTop: '5px')
      ctx.lineTo(27, 5);              // Bottom wing (matches UI borderBottom: '5px')
      ctx.closePath();
      ctx.fill();
      
      // Restore context state
      ctx.restore();
      
      console.log(`Arrow ${index + 1} drawn successfully`);
    } catch (error) {
      console.warn(`Error drawing arrow ${index + 1}:`, error);
    }
  });
};

export const captureTransformedImage = (containerSelector, arrowsData = []) => {
  return new Promise((resolve) => {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error('Image container not found');
      resolve(null);
      return;
    }

    // Find the transformed image element
    const transformedImg = container.querySelector('.absolute.inset-0');
    if (!transformedImg) {
      console.error('Transformed image element not found');
      resolve(null);
      return;
    }

    // Find all arrow elements in the container
    const arrowElements = container.querySelectorAll('[data-arrow="true"]');
    
    console.log('Found arrow elements:', arrowElements.length);
    console.log('Arrows data provided:', arrowsData.length);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: true,
      desynchronized: false
    });
    
    // Get the container's dimensions
    const { width, height } = container.getBoundingClientRect();
    
    // Use a higher resolution for better quality (3x for optimal print quality)
    const scale = 3 * (window.devicePixelRatio || 1);
    
    // Set canvas dimensions (higher resolution)
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    
    // Scale the context to ensure everything is drawn at the correct size
    ctx.scale(scale, scale);
    
    // Set canvas display size (CSS pixels)
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Set high quality rendering for print output
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.patternQuality = 'high';
    ctx.quality = 'high';
    ctx.textRenderingOptimization = 'optimizeQuality';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const style = window.getComputedStyle(transformedImg);
    const backgroundImage = style.backgroundImage;
    const imgUrl = backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Calculate the image dimensions to maintain aspect ratio
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const containerAspect = width / height;
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        
        if (imgAspect > containerAspect) {
          // Image is wider than container
          drawWidth = width;
          drawHeight = width / imgAspect;
          offsetY = (height - drawHeight) / 2;
        } else {
          // Image is taller than container
          drawHeight = height;
          drawWidth = height * imgAspect;
          offsetX = (width - drawWidth) / 2;
        }

        // Get the transform matrix
        const transform = window.getComputedStyle(transformedImg).transform;
        
        // Set the transform origin to center (same as in ImageEditor)
        ctx.save();
        ctx.translate(width / 2, height / 2);
        
        if (transform && transform !== 'none') {
          // Apply the transform matrix
          const matrix = transform.match(/^matrix\((.+)\)$/)[1].split(',').map(Number);
          ctx.transform(
            matrix[0], matrix[1],
            matrix[2], matrix[3],
            matrix[4], matrix[5]
          );
        }
        
        // Save the current context state
        ctx.save();
        
        try {
          // Set the highest quality image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw the image centered with high quality
          ctx.drawImage(
            img, 
            -drawWidth / 2,  // x
            -drawHeight / 2, // y
            drawWidth,       // width
            drawHeight       // height
          );
          
        } finally {
          // Always restore the context
          ctx.restore();
        }
        
        // Restore the outer context (from translate to center)
        ctx.restore();
        
        // Draw arrows on top of the image (after restoring all transforms)
        // Arrows are drawn in the original coordinate system (0,0 = top-left)
        drawArrows(ctx, arrowsData, width, height);
        
        // Create a new canvas for final output with exact dimensions
        const outputCanvas = document.createElement('canvas');
        const outputCtx = outputCanvas.getContext('2d', { 
          willReadFrequently: true,
          alpha: true,
          desynchronized: false
        });
        
        // Set output dimensions (maintain high resolution)
        outputCanvas.width = canvas.width;
        outputCanvas.height = canvas.height;
        
        // Set maximum quality settings for final output
        outputCtx.imageSmoothingEnabled = true;
        outputCtx.imageSmoothingQuality = 'high';
        outputCtx.textRenderingOptimization = 'optimizeQuality';
        outputCtx.lineCap = 'round';
        outputCtx.lineJoin = 'round';
        outputCtx.drawImage(canvas, 0, 0);
        
        // Convert to data URL with maximum quality (PNG for lossless)
        const dataUrl = outputCanvas.toDataURL('image/png', 1.0);
        
        // Return the data URL
        resolve(dataUrl);
        
        // Clean up after resolving
        setTimeout(() => {
          outputCanvas.width = 1;
          outputCanvas.height = 1;
        }, 0);
        
        // Clean up the main canvas
        setTimeout(() => {
          canvas.width = 1;
          canvas.height = 1;
        }, 0);
      } catch (error) {
        console.error('Error capturing transformed image:', error);
        resolve(null);
      }
    };
    
    img.onerror = (error) => {
      console.error('Error loading image for capture:', error);
      resolve(null);
    };
    
    img.src = imgUrl;
  });
};
