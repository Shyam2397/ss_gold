/**
 * Web Worker for heavy image processing operations
 * Offloads CPU-intensive tasks from main thread
 */

// Image processing worker for levels adjustment
const processLevels = (imageData, adjustment) => {
  const { black, white, gamma } = adjustment;
  const data = imageData.data;
  
  // Calculate lookup table
  const lut = new Array(256);
  const blackPoint = Math.round(black * 255);
  const whitePoint = Math.round(white * 255);
  
  for (let i = 0; i < 256; i++) {
    let value = (i - blackPoint) * (255 / (whitePoint - blackPoint));
    value = Math.pow(value / 255, 1 / gamma) * 255;
    lut[i] = Math.max(0, Math.min(255, Math.round(value)));
  }
  
  // Apply lookup table
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];         // R
    data[i + 1] = lut[data[i + 1]]; // G
    data[i + 2] = lut[data[i + 2]]; // B
  }
  
  return imageData;
};

// Image processing worker for curves adjustment
const processCurves = (imageData, adjustment) => {
  const { curveLUT } = adjustment;
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = curveLUT[data[i]];         // R
    data[i + 1] = curveLUT[data[i + 1]]; // G
    data[i + 2] = curveLUT[data[i + 2]]; // B
  }
  
  return imageData;
};

// Arrow processing for memory buffer capture
const processArrows = (canvasData, arrowsData, scaleX, scaleY) => {
  const { canvas, context } = canvasData;
  
  arrowsData.forEach((arrow, index) => {
    try {
      const arrowX = arrow.x * scaleX;
      const arrowY = arrow.y * scaleY;
      const rotation = arrow.angle * (Math.PI / 180);
      
      const arrowLength = 35 * Math.min(scaleX, scaleY);
      const arrowWidth = Math.max(0.8, 1.5 * Math.min(scaleX, scaleY) * 0.7);
      const arrowHeadSize = Math.max(2, 5 * Math.min(scaleX, scaleY) * 0.8);
      
      context.save();
      
      // Disable smoothing
      context.imageSmoothingEnabled = false;
      context.lineCap = 'butt';
      context.lineJoin = 'miter';
      
      context.translate(arrowX, arrowY);
      context.rotate(rotation);
      
      context.strokeStyle = '#FF0000';
      context.fillStyle = '#FF0000';
      context.lineWidth = arrowWidth;
      
      // Draw shaft
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(arrowLength, 0);
      context.stroke();
      
      // Draw head
      context.beginPath();
      context.moveTo(arrowLength, 0);
      context.lineTo(arrowLength - 8 * Math.min(scaleX, scaleY) * 0.8, -arrowHeadSize);
      context.lineTo(arrowLength - 8 * Math.min(scaleX, scaleY) * 0.8, arrowHeadSize);
      context.closePath();
      context.fill();
      
      context.restore();
      
    } catch (error) {
      console.warn(`Error processing arrow ${index + 1}:`, error);
    }
  });
  
  return canvas;
};

// Worker message handler
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'PROCESS_LEVELS':
        result = processLevels(data.imageData, data.adjustment);
        break;
        
      case 'PROCESS_CURVES':
        result = processCurves(data.imageData, data.adjustment);
        break;
        
      case 'PROCESS_ARROWS':
        result = processArrows(data.canvasData, data.arrowsData, data.scaleX, data.scaleY);
        break;
        
      default:
        throw new Error(`Unknown processing type: ${type}`);
    }
    
    self.postMessage({
      type: 'SUCCESS',
      id,
      result
    });
    
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      id,
      error: error.message
    });
  }
};