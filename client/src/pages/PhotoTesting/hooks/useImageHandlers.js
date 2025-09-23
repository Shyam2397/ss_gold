import { useCallback } from 'react';

export const useImageHandlers = (state, dispatch) => {
  const { originalImage } = state;

  const handleImageUpload = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgUrl = e.target.result;
        dispatch({ type: 'SET_ORIGINAL_IMAGE', payload: imgUrl });
        dispatch({ type: 'SET_ADJUSTED_IMAGE', payload: imgUrl });
        dispatch({ type: 'SET_UPLOADED_IMAGE', payload: imgUrl });
        // Reset transform when new image is uploaded
        dispatch({ type: 'SET_TRANSFORM', payload: { scale: 1, x: 0, y: 0 } });
      };
      reader.readAsDataURL(file);
    }
  }, [dispatch]);

  const handleApplyLevels = useCallback((adjustment) => {
    if (!originalImage) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      if (adjustment.type === 'levels') {
        const { black, white, gamma } = adjustment;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate lookup table for levels adjustment
        const lut = new Array(256);
        const blackPoint = Math.round(black * 255);
        const whitePoint = Math.round(white * 255);
        
        for (let i = 0; i < 256; i++) {
          // Apply black and white points
          let value = (i - blackPoint) * (255 / (whitePoint - blackPoint));
          // Apply gamma correction
          value = Math.pow(value / 255, 1 / gamma) * 255;
          // Clamp to 0-255
          lut[i] = Math.max(0, Math.min(255, Math.round(value)));
        }
        
        // Apply the lookup table to the image
        for (let i = 0; i < data.length; i += 4) {
          data[i] = lut[data[i]];         // R
          data[i + 1] = lut[data[i + 1]]; // G
          data[i + 2] = lut[data[i + 2]]; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
      } 
      else if (adjustment.type === 'curves') {
        const { curveLUT } = adjustment;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply the curve lookup table to each RGB channel
        for (let i = 0; i < data.length; i += 4) {
          data[i] = curveLUT[data[i]];         // R
          data[i + 1] = curveLUT[data[i + 1]]; // G
          data[i + 2] = curveLUT[data[i + 2]]; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      // Update the displayed image with high quality
      const adjustedUrl = canvas.toDataURL('image/jpeg', 0.95); // High quality JPEG
      dispatch({ type: 'SET_ADJUSTED_IMAGE', payload: adjustedUrl });
      dispatch({ type: 'SET_UPLOADED_IMAGE', payload: adjustedUrl });
    };
    
    img.src = originalImage;
  }, [originalImage, dispatch]);

  const resetLevels = useCallback(() => {
    if (originalImage) {
      dispatch({ type: 'SET_UPLOADED_IMAGE', payload: originalImage });
      dispatch({ type: 'SET_ADJUSTED_IMAGE', payload: originalImage });
    }
  }, [originalImage, dispatch]);

  return {
    handleImageUpload,
    handleApplyLevels,
    resetLevels
  };
};
