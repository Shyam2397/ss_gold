import React, { useRef, useCallback, useEffect, Suspense } from 'react';
import { usePhotoTestingState } from './hooks/usePhotoTestingState';
import { useImageHandlers } from './hooks/useImageHandlers';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useTokenSearch } from './hooks/useTokenSearch';
import { lazyLoad } from '../../components/common/LazyLoad';
import { printPhotoData } from './utils/printUtils';
import { captureTransformedImage } from './utils/imageCapture';

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
    console.log('Print button clicked');
    console.log('Form data:', formData);
    console.log('Uploaded image exists:', !!uploadedImage);
    console.log('Arrows data:', arrows);
    
    try {
      // Capture the transformed image from the UI
      let capturedImageUrl = uploadedImage;
      
      if (uploadedImage) {
        // Give the UI a moment to update before capturing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture the transformed image from the UI
        const transformedImage = await captureTransformedImage('.relative.w-full.h-full.group', arrows);
        if (transformedImage) {
          capturedImageUrl = transformedImage;
          console.log('Using transformed image for print');
        } else {
          console.warn('Could not capture transformed image, using original');
        }
      }
      
      const printData = {
        ...formData,
        tokenNo,
        photoUrl: capturedImageUrl,
        date: new Date().toISOString()
      };
      
      console.log('Print data prepared');
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
