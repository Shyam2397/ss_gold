import { useCallback, useRef, useEffect } from 'react';
import { canvasManager, processImageDataChunked, memoryMonitor, BlobUrlManager } from '../utils/memoryOptimizer';

/**
 * Performance-optimized image handlers with memory management
 */
export const useOptimizedImageHandlers = (state, dispatch) => {
  const { originalImage } = state;
  const blobManagerRef = useRef(new BlobUrlManager());
  const processingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      blobManagerRef.current.cleanup();
      canvasManager.cleanup();
    };
  }, []);

  const handleImageUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    // Check memory pressure before processing
    if (memoryMonitor.checkMemoryPressure()) {
      console.warn('⚠️ High memory pressure detected, optimizing...');
      // Force garbage collection if possible
      if (window.gc) window.gc();
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target.result;
      dispatch({ type: 'SET_ORIGINAL_IMAGE', payload: imgUrl });
      dispatch({ type: 'SET_ADJUSTED_IMAGE', payload: imgUrl });
      dispatch({ type: 'SET_UPLOADED_IMAGE', payload: imgUrl });
      dispatch({ type: 'SET_TRANSFORM', payload: { scale: 1, x: 0, y: 0 } });
      
      if (process.env.NODE_ENV === 'development') {
        memoryMonitor.logMemoryUsage();
      }
    };
    reader.readAsDataURL(file);
  }, [dispatch]);

  const handleApplyLevels = useCallback(async (adjustment) => {
    if (!originalImage || processingRef.current) return;
    
    processingRef.current = true;
    
    try {
      const canvas = canvasManager.getCanvas(0, 0); // Will be resized
      const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
        alpha: false
      });
      
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw the original image
            ctx.drawImage(img, 0, 0);
            
            if (adjustment.type === 'levels') {
              const { black, white, gamma } = adjustment;
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Calculate lookup table
              const lut = new Array(256);
              const blackPoint = Math.round(black * 255);
              const whitePoint = Math.round(white * 255);
              
              for (let i = 0; i < 256; i++) {
                let value = (i - blackPoint) * (255 / (whitePoint - blackPoint));
                value = Math.pow(value / 255, 1 / gamma) * 255;
                lut[i] = Math.max(0, Math.min(255, Math.round(value)));
              }
              
              // Process image data in chunks to prevent blocking
              await processImageDataChunked(imageData, (data, start, end) => {
                for (let i = start; i < end; i += 4) {
                  data[i] = lut[data[i]];         // R
                  data[i + 1] = lut[data[i + 1]]; // G
                  data[i + 2] = lut[data[i + 2]]; // B
                }
              });
              
              ctx.putImageData(imageData, 0, 0);
            } 
            else if (adjustment.type === 'curves') {
              const { curveLUT } = adjustment;
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Process curves in chunks
              await processImageDataChunked(imageData, (data, start, end) => {
                for (let i = start; i < end; i += 4) {
                  data[i] = curveLUT[data[i]];         // R
                  data[i + 1] = curveLUT[data[i + 1]]; // G
                  data[i + 2] = curveLUT[data[i + 2]]; // B
                }
              });
              
              ctx.putImageData(imageData, 0, 0);
            }
            
            // Convert to blob for memory efficiency
            canvas.toBlob((blob) => {
              const adjustedUrl = blobManagerRef.current.createUrl(blob);
              dispatch({ type: 'SET_ADJUSTED_IMAGE', payload: adjustedUrl });
              dispatch({ type: 'SET_UPLOADED_IMAGE', payload: adjustedUrl });
              
              // Clean up canvas
              canvasManager.releaseCanvas(canvas);
              resolve();
            }, 'image/jpeg', 0.95);
            
          } catch (error) {
            canvasManager.releaseCanvas(canvas);
            reject(error);
          }
        };
        
        img.onerror = reject;
        img.src = originalImage;
      });
      
    } catch (error) {
      console.error('Error applying levels:', error);
    } finally {
      processingRef.current = false;
    }
  }, [originalImage, dispatch]);

  const resetLevels = useCallback(() => {
    if (originalImage) {
      dispatch({ type: 'SET_UPLOADED_IMAGE', payload: originalImage });
      dispatch({ type: 'SET_ADJUSTED_IMAGE', payload: originalImage });
      
      // Clean up any blob URLs
      blobManagerRef.current.cleanup();
    }
  }, [originalImage, dispatch]);

  return {
    handleImageUpload,
    handleApplyLevels,
    resetLevels
  };
};