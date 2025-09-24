import React, { useRef, useCallback, useEffect, Suspense } from 'react';
import { usePhotoTestingState } from './hooks/usePhotoTestingState';
import { useImageHandlers } from './hooks/useImageHandlers';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useTokenSearch } from './hooks/useTokenSearch';
import { useProgressiveLoading } from './hooks/useComponentLoader';
import { 
  createLazyComponent, 
  componentDefinitions, 
  analyzeBundleSize, 
  preloadCriticalComponents,
  loadUtility 
} from './utils/componentLoader';
import { 
  withEnhancedLazyLoading, 
  SkeletonLoader, 
  SmartFallback 
} from './components/LazyLoadWrapper';

// Create lazy components with enhanced loading and webpack chunk names
const LazyPhotoTestingLayout = createLazyComponent(
  componentDefinitions.PhotoTestingLayout.loader,
  componentDefinitions.PhotoTestingLayout.chunkName,
  componentDefinitions.PhotoTestingLayout.options
);

const LazyImageEditor = createLazyComponent(
  componentDefinitions.ImageEditor.loader,
  componentDefinitions.ImageEditor.chunkName,
  componentDefinitions.ImageEditor.options
);

const LazyTestResultForm = createLazyComponent(
  componentDefinitions.TestResultForm.loader,
  componentDefinitions.TestResultForm.chunkName,
  componentDefinitions.TestResultForm.options
);

const LazyTokenSearchForm = createLazyComponent(
  componentDefinitions.TokenSearchForm.loader,
  componentDefinitions.TokenSearchForm.chunkName,
  componentDefinitions.TokenSearchForm.options
);

const LazyHeader = createLazyComponent(
  componentDefinitions.Header.loader,
  componentDefinitions.Header.chunkName,
  componentDefinitions.Header.options
);

const LazyGridOverlay = createLazyComponent(
  componentDefinitions.GridOverlay.loader,
  componentDefinitions.GridOverlay.chunkName,
  componentDefinitions.GridOverlay.options
);

// Enhanced wrapper components with intelligent fallbacks
const PhotoTestingLayoutWithFallback = withEnhancedLazyLoading(LazyPhotoTestingLayout, {
  componentName: 'PhotoTesting Layout',
  fallbackType: 'layout',
  showProgress: true,
  enableSkeleton: true
});

const ImageEditorWithFallback = withEnhancedLazyLoading(LazyImageEditor, {
  componentName: 'Image Editor',
  fallbackType: 'imageEditor',
  enableSkeleton: true
});

const TestResultFormWithFallback = withEnhancedLazyLoading(LazyTestResultForm, {
  componentName: 'Test Result Form',
  fallbackType: 'form',
  enableSkeleton: true
});

const TokenSearchFormWithFallback = withEnhancedLazyLoading(LazyTokenSearchForm, {
  componentName: 'Token Search Form',
  fallbackType: 'form',
  enableSkeleton: true
});

const HeaderWithFallback = withEnhancedLazyLoading(LazyHeader, {
  componentName: 'Header',
  fallbackType: 'header',
  enableSkeleton: true
});

const GridOverlayWithFallback = withEnhancedLazyLoading(LazyGridOverlay, {
  componentName: 'Grid Overlay',
  fallbackType: 'default',
  enableSkeleton: false
});

// Enhanced loading fallback with progress
const LoadingFallback = ({ progress }) => (
  <div className="flex flex-col items-center justify-center h-64">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      {progress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-amber-600">
            {progress}%
          </span>
        </div>
      )}
    </div>
    <div className="mt-3 text-sm text-gray-600">
      Loading PhotoTesting Module...
    </div>
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

  // Initialize progressive loading for development insights
  const progressiveLoading = useProgressiveLoading([
    { name: 'PhotoTestingLayout', loader: componentDefinitions.PhotoTestingLayout.loader },
    { name: 'ImageEditor', loader: componentDefinitions.ImageEditor.loader },
    { name: 'TestResultForm', loader: componentDefinitions.TestResultForm.loader },
    { name: 'TokenSearchForm', loader: componentDefinitions.TokenSearchForm.loader },
    { name: 'Header', loader: componentDefinitions.Header.loader },
    { name: 'GridOverlay', loader: componentDefinitions.GridOverlay.loader }
  ], {
    batchSize: 2,
    delay: 50,
    enableMemoryOptimization: true
  });
  
  // Performance monitoring and bundle analysis
  useEffect(() => {
    analyzeBundleSize();
    preloadCriticalComponents();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Progressive Loading Progress:', progressiveLoading.loadingState.progress + '%');
    }
  }, [progressiveLoading.loadingState.progress]);

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
        
        // Dynamically load image processing utilities only when needed
        const [{ captureMemoryBufferImage, createRawMemoryBitmap }, { printPhotoData }] = await Promise.all([
          loadUtility('excelQualityCapture'),
          loadUtility('printUtils')
        ]);
        
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
        
        const printData = {
          ...formData,
          tokenNo,
          photoUrl: capturedImageUrl, // Will be null if no image
          date: new Date().toISOString()
        };
        
        console.log('Print data prepared with MEMORY BUFFER Excel-quality image');
        printPhotoData(printData);
      } else {
        console.log('No image uploaded - Printing with pure white background');
        
        // Load only print utils for no-image scenario
        const { printPhotoData } = await loadUtility('printUtils');
        
        const printData = {
          ...formData,
          tokenNo,
          photoUrl: null, // No image
          date: new Date().toISOString()
        };
        
        console.log('Print data prepared without image (pure white background)');
        printPhotoData(printData);
      }
    } catch (error) {
      console.error('Error preparing print data:', error);
      alert('Error preparing print data. Please try again.');
    }
  }, [formData, tokenNo, uploadedImage, arrows]);

  return (
    <Suspense fallback={<LoadingFallback progress={progressiveLoading.loadingState.progress} />}>
      <PhotoTestingLayoutWithFallback
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
        // Pass enhanced lazy-loaded components with fallbacks
        components={{
          ImageEditor: ImageEditorWithFallback,
          TestResultForm: TestResultFormWithFallback,
          TokenSearchForm: TokenSearchFormWithFallback,
          Header: HeaderWithFallback,
          GridOverlay: GridOverlayWithFallback
        }}
        // Progressive loading state for development insights
        loadingState={progressiveLoading.loadingState}
      />
      
      {/* Development insights */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-2 rounded text-xs">
          <div>Loading: {progressiveLoading.loadingState.progress}%</div>
          <div>Loaded: {progressiveLoading.loadingState.loaded.size}/{Object.keys(componentDefinitions).length}</div>
          {progressiveLoading.hasErrors && (
            <div className="text-red-400">Errors: {progressiveLoading.loadingState.failed.size}</div>
          )}
        </div>
      )}
    </Suspense>
  );
};

export default PhotoTesting;
