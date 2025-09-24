// Helper function to draw arrows on canvas using exact state data
const drawArrows = (ctx, arrowsData, containerWidth, containerHeight) => {
  if (!arrowsData || arrowsData.length === 0) {
    console.log('No arrows data provided for drawing');
    return;
  }

  console.log('Drawing arrows with data:', arrowsData);
  console.log('Container dimensions:', { containerWidth, containerHeight });
  console.log('Canvas context transform after reset:');
  console.log('Current transform matrix:', ctx.getTransform());

  arrowsData.forEach((arrow, index) => {
    try {
      // Use exact arrow state data (x, y, angle) - these should be container-relative coordinates
      const arrowX = arrow.x;
      const arrowY = arrow.y;
      const rotation = arrow.angle * (Math.PI / 180); // Convert degrees to radians
      
      console.log(`Canvas Arrow ${index + 1} - Position: (${arrowX}, ${arrowY}), Angle: ${arrow.angle}°`);
      
      // Save context state
      ctx.save();
      
      // Set basic quality rendering settings to match UI
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.lineCap = 'butt';                   // Match UI sharp ends
      ctx.lineJoin = 'miter';                 // Match UI sharp corners
      ctx.miterLimit = 10;
      
      // Move to exact arrow position from state (container-relative coordinates)
      ctx.translate(arrowX, arrowY);
      
      // Apply rotation from state
      ctx.rotate(rotation);
      
      // Enhanced arrow drawing properties to match UI exactly
      ctx.strokeStyle = '#FF0000';        // Match UI backgroundColor: 'red'
      ctx.fillStyle = '#FF0000';          // Match UI borderLeft color
      ctx.lineWidth = 1.5;            // Match UI height: '1.5px'
      
      // Draw arrow shaft to match UI dimensions exactly
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(35, 0);              // Match UI width: '35px'
      ctx.stroke();
      
      // Draw arrowhead to match UI CSS border triangle exactly
      ctx.beginPath();
      ctx.moveTo(35, 0);              // Arrow tip
      ctx.lineTo(27, -5);             // Top wing (matches UI borderTop: '5px')
      ctx.lineTo(27, 5);              // Bottom wing (matches UI borderBottom: '5px')
      ctx.closePath();
      ctx.fill();
      
      // Restore context state
      ctx.restore();
      
      console.log(`Canvas Arrow ${index + 1} drawn successfully`);
    } catch (error) {
      console.warn(`Error drawing canvas arrow ${index + 1}:`, error);
    }
  });
};

export const captureTransformedImage = (containerSelector, arrowsData = []) => {
  return new Promise((resolve) => {
    const container = document.querySelector(containerSelector);
    if (!container) {
      console.error('Image container not found with selector:', containerSelector);
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

    // Get container dimensions
    const rect = container.getBoundingClientRect();
    console.log('Container selector used:', containerSelector);
    console.log('Container dimensions for capture:', { width: rect.width, height: rect.height });
    console.log('Arrows data for capture:', arrowsData.map(a => ({ id: a.id, x: a.x, y: a.y, angle: a.angle })));
    
    // Set up ultra-high-DPI canvas for professional print quality (600+ DPI equivalent)
    const dpr = window.devicePixelRatio || 1;
    const printScale = 6; // 6x scale for ultra-high-quality print (600+ DPI)
    
    // Get the container's dimensions
    const { width, height } = container.getBoundingClientRect();
    
    const canvas = document.createElement('canvas');
    // Set canvas dimensions to ultra-high resolution for professional print
    canvas.width = Math.floor(width * printScale);
    canvas.height = Math.floor(height * printScale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d', { 
      willReadFrequently: false, // Optimize for quality over read speed
      alpha: false, // No transparency needed for print
      desynchronized: false 
    });
    
    // Scale the context for ultra-high-DPI rendering
    ctx.scale(printScale, printScale);
    
    // Set canvas display size (CSS pixels)
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Set maximum quality rendering for print output
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Set white background for print
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

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
        
        // CRITICAL: Reset transform matrix before drawing arrows to ensure consistent coordinate system
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
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
        
        // Convert to data URL with maximum quality (PNG for absolute lossless quality)
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
