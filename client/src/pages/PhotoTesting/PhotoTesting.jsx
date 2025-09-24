import React, { useRef, useCallback, useEffect, Suspense } from 'react';
import { usePhotoTestingState } from './hooks/usePhotoTestingState';
import { useImageHandlers } from './hooks/useImageHandlers';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useTokenSearch } from './hooks/useTokenSearch';
import { lazyLoad } from '../../components/common/LazyLoad';
import { printPhotoData } from './utils/printUtils';
import { captureTransformedImage } from './utils/imageCapture';
import { capturePixelPerfectImage } from './utils/pixelPerfectCapture';
import { createPixelPerfectPrint, createDirectBitmap } from './utils/printImageOptimizer';
import { captureMemoryBufferImage, createRawMemoryBitmap } from './utils/excelQualityCapture';

// Lazy load the layout component
const LazyPhotoTestingLayout = lazyLoad(() => 
  import('./components/PhotoTestingLayout')
);

// Lazy load other heavy components
const LazyImageEditor = lazyLoad(() => 
  import('./components/ImageEditor')
);

const LazyTestResultForm = lazyLoad(() => 
  import('./components/TestResultForm')
);

const LazyTokenSearchForm = lazyLoad(() => 
  import('./components/TokenSearchForm')
);

const LazyHeader = lazyLoad(() => 
  import('./components/Header')
);

const LazyGridOverlay = lazyLoad(() => 
  import('./components/GridOverlay')
);

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
  </div>
);


const PhotoTesting = () => {
  const [state, dispatch] = usePhotoTestingState();
  const {
    uploadedImage,
    isDragging,
    transform,
    isDraggingImage,
    isDraggingStarted,
    tokenNo,
    formData,
    showLevels,
    originalImage,
    arrows
  } = state;
  
  const fileInputRef = useRef(null);
  
  // Initialize hooks
  const { handleImageUpload, handleApplyLevels, resetLevels } = useImageHandlers(state, dispatch);
  const { handleTokenSearch, resetForm } = useTokenSearch(dispatch);
  
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDragOver,
    handleDragLeave,
    handleDrop: handleDragDrop
  } = useDragAndDrop(state, dispatch);

  const handleArrowsChange = useCallback((newArrows) => {
    dispatch({ type: 'SET_ARROWS', payload: newArrows });
  }, [dispatch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTokenSearch(tokenNo);
    }
  };

  const zoom = useCallback((factor) => {
    const newScale = Math.max(0.5, Math.min(transform.scale + factor, 3));
    dispatch({
      type: 'SET_TRANSFORM',
      payload: { scale: newScale }
    });
  }, [transform.scale, dispatch]);

  const resetTransform = useCallback(() => {
    dispatch({ type: 'SET_TRANSFORM', payload: { scale: 1, x: 0, y: 0 } });
  }, [dispatch]);

  const handleToggleLevels = useCallback(() => {
    dispatch({ type: 'SET_SHOW_LEVELS', payload: !showLevels });
  }, [showLevels, dispatch]);

  const handleCloseAdjustment = useCallback(() => {
    dispatch({ type: 'SET_SHOW_LEVELS', payload: false });
  }, [dispatch]);

  const handleTokenNoChange = useCallback((value) => {
    dispatch({ type: 'SET_TOKEN_NO', payload: value });
  }, [dispatch]);

  const handleFileSelect = useCallback((file) => {
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleTriggerFileSelect = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    fileInputRef.current?.click();
  }, []);

  // Set up global event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDraggingImage) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (isDraggingImage) {
        const mouseUpEvent = new MouseEvent('mouseup', e);
        handleMouseUp(mouseUpEvent);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingImage, handleMouseMove, handleMouseUp]);

  // Add event listeners for mouse move and up
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDraggingImage) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (isDraggingImage) {
        handleMouseUp(e);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingImage, handleMouseMove]);

  const handlePrint = useCallback(async () => {
    console.log('Print button clicked - Supporting print with or without image');
    console.log('Form data:', formData);
    console.log('Uploaded image exists:', !!uploadedImage);
    console.log('Arrows data:', arrows);
    
    try {
      let capturedImageUrl = null; // Default to null for no image
      
      if (uploadedImage) {
        console.log('Image available - Starting MEMORY BUFFER capture process...');
        console.log('Container selector: .w-full.h-full.overflow-hidden.relative');
        console.log('Arrows for capture:', arrows.map(a => ({ x: a.x, y: a.y, angle: a.angle })));
        
        // Step 1: Memory buffer capture (bypasses ALL browser processing)
        const memoryBufferImage = await captureMemoryBufferImage('.w-full.h-full.overflow-hidden.relative', arrows);
        
        if (memoryBufferImage) {
          console.log('Memory buffer capture successful');
          
          // Step 2: Raw memory bitmap processing
          const rawMemoryBitmap = await createRawMemoryBitmap(memoryBufferImage);
          capturedImageUrl = rawMemoryBitmap;
          
          console.log('Raw memory bitmap created - EXCEL QUALITY ACHIEVED');
        } else {
          console.warn('Memory buffer capture failed, using raw bitmap fallback');
          // Fallback: Direct raw memory bitmap of original
          const fallbackRawBitmap = await createRawMemoryBitmap(uploadedImage);
          capturedImageUrl = fallbackRawBitmap;
        }
      } else {
        console.log('No image uploaded - Printing with pure white background');
        // No image processing needed, will show pure white background
      }
      
      const printData = {
        ...formData,
        tokenNo,
        photoUrl: capturedImageUrl, // Will be null if no image
        date: new Date().toISOString()
      };
      
      console.log('Print data prepared', capturedImageUrl ? 'with MEMORY BUFFER Excel-quality image' : 'without image (pure white background)');
      printPhotoData(printData);
    } catch (error) {
      console.error('Error preparing print data:', error);
      alert('Error preparing print data. Please try again.');
    }
  }, [formData, tokenNo, uploadedImage, arrows]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <LazyPhotoTestingLayout
        onPrint={handlePrint}
        tokenNo={tokenNo}
        onTokenNoChange={handleTokenNoChange}
        onTokenSearch={() => handleTokenSearch(tokenNo)}
        onResetForm={resetForm}
        onKeyDown={handleKeyDown}
        formData={formData}
        onImageUpload={handleImageUpload}
        transform={transform}
        isDraggingImage={isDraggingImage}
        showLevels={showLevels}
        originalImage={originalImage}
        adjustedImage={state.adjustedImage}
        onZoom={zoom}
        onResetTransform={resetTransform}
        onToggleLevels={handleToggleLevels}
        onApplyLevels={handleApplyLevels}
        onResetLevels={resetLevels}
        onCloseAdjustment={handleCloseAdjustment}
        onDragStart={handleMouseDown}
        onDragEnd={handleMouseUp}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDragDrop}
        fileInputRef={fileInputRef}
        onFileSelect={handleFileSelect}
        uploadedImage={uploadedImage}
        isDragging={isDragging}
        onArrowsChange={handleArrowsChange}
        // Pass lazy-loaded components as props
        components={{
          ImageEditor: LazyImageEditor,
          TestResultForm: LazyTestResultForm,
          TokenSearchForm: LazyTokenSearchForm,
          Header: LazyHeader,
          GridOverlay: LazyGridOverlay
        }}
      />
    </Suspense>
  );
};

export default PhotoTesting;
