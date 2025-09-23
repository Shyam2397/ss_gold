// Pixel-perfect image capture for professional print quality
// This completely bypasses browser rendering artifacts

const drawArrowsAtNativeResolution = (ctx, arrowsData, canvasWidth, canvasHeight, scaleX, scaleY) => {
  if (!arrowsData || arrowsData.length === 0) {
    return;
  }

  console.log('Drawing arrows at native resolution with scale:', { scaleX, scaleY });

  arrowsData.forEach((arrow, index) => {
    try {
      // Scale arrow coordinates to native image resolution
      const arrowX = arrow.x * scaleX;
      const arrowY = arrow.y * scaleY;
      const rotation = arrow.angle * (Math.PI / 180);
      
      console.log(`Arrow ${index + 1} - Native Position: (${arrowX}, ${arrowY}), Angle: ${arrow.angle}°`);
      
      ctx.save();
      
      // Disable smoothing for crisp arrow rendering
      ctx.imageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      ctx.oImageSmoothingEnabled = false;
      
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 10;
      
      // Move to scaled arrow position
      ctx.translate(arrowX, arrowY);
      ctx.rotate(rotation);
      
      // Scale arrow size to image resolution
      const arrowLength = 35 * scaleX;
      const arrowWidth = 1.5 * Math.min(scaleX, scaleY);
      const arrowHeadSize = 5 * Math.min(scaleX, scaleY);
      
      ctx.strokeStyle = 'red';
      ctx.fillStyle = 'red';
      ctx.lineWidth = arrowWidth;
      
      // Draw arrow shaft
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(arrowLength, 0);
      ctx.stroke();
      
      // Draw arrowhead
      ctx.beginPath();
      ctx.moveTo(arrowLength, 0);
      ctx.lineTo(arrowLength - 8 * scaleX, -arrowHeadSize);
      ctx.lineTo(arrowLength - 8 * scaleX, arrowHeadSize);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
      
    } catch (error) {
      console.warn(`Error drawing arrow ${index + 1}:`, error);
    }
  });
};

export const capturePixelPerfectImage = (containerSelector, arrowsData = []) => {
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

    // Get the original image source directly
    const style = window.getComputedStyle(transformedImg);
    const backgroundImage = style.backgroundImage;
    const imgUrl = backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Get container dimensions
        const { width, height } = container.getBoundingClientRect();
        
        // Create canvas at NATIVE image resolution - this is key!
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d', { 
          willReadFrequently: false,
          alpha: false,
          desynchronized: false 
        });
        
        // Calculate scale factors
        const scaleX = img.naturalWidth / width;
        const scaleY = img.naturalHeight / height;
        
        console.log('Native image dimensions:', img.naturalWidth, 'x', img.naturalHeight);
        console.log('Container dimensions:', width, 'x', height);
        console.log('Scale factors:', scaleX, scaleY);
        
        // DISABLE ALL SMOOTHING - this is crucial for pixel-perfect output
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.oImageSmoothingEnabled = false;
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Get transform matrix
        const transform = window.getComputedStyle(transformedImg).transform;
        
        // Apply transforms at native resolution
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        if (transform && transform !== 'none') {
          const matrix = transform.match(/^matrix\((.+)\)$/)[1].split(',').map(Number);
          // Scale translation components to native resolution
          ctx.transform(
            matrix[0], matrix[1],
            matrix[2], matrix[3],
            matrix[4] * scaleX, matrix[5] * scaleY
          );
        }
        
        // Draw image at native resolution (1:1 pixel mapping)
        ctx.drawImage(
          img, 
          -canvas.width / 2,  
          -canvas.height / 2, 
          canvas.width,       
          canvas.height       
        );
        
        ctx.restore();
        
        // Draw arrows at native resolution
        drawArrowsAtNativeResolution(ctx, arrowsData, canvas.width, canvas.height, scaleX, scaleY);
        
        // Export as PNG - no compression, no quality loss
        const dataUrl = canvas.toDataURL('image/png');
        
        console.log('Pixel-perfect capture completed. Output dimensions:', canvas.width, 'x', canvas.height);
        
        // Clean up
        canvas.width = 1;
        canvas.height = 1;
        
        resolve(dataUrl);
        
      } catch (error) {
        console.error('Error in pixel-perfect capture:', error);
        resolve(null);
      }
    };
    
    img.onerror = (error) => {
      console.error('Error loading image for pixel-perfect capture:', error);
      resolve(null);
    };
    
    img.src = imgUrl;
  });
};