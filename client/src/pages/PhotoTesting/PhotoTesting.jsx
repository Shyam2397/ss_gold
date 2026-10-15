import React, { useCallback, useEffect, useState, Suspense, lazy } from 'react';
import { usePhotoTestingState } from './hooks/usePhotoTestingState';
import { useTokenSearch } from './hooks/useTokenSearch';
import { useProgressiveLoading } from './hooks/useComponentLoader';
import { 
  createLazyComponent, 
  componentDefinitions, 
  analyzeBundleSize, 
  preloadCriticalComponents,
  loadUtility 
} from './utils/componentLoader';
import { withEnhancedLazyLoading } from './components/LazyLoadWrapper';
import { createDefaultArrows } from './components/PhotoArrows';

// Reuse the Photo Studio editor (lazily) so its worker/engine chunks only load
// when the user actually opens the editor.
const LazyPhotoStudioEditor = lazy(() => import('../PhotoStudio/PhotoStudio'));

// Create lazy components with enhanced loading and webpack chunk names
const LazyPhotoTestingLayout = createLazyComponent(
  componentDefinitions.PhotoTestingLayout.loader,
  componentDefinitions.PhotoTestingLayout.chunkName,
  componentDefinitions.PhotoTestingLayout.options
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


// Photo zoom limits (scale of the printed/preview image area)
const MIN_PHOTO_SCALE = 0.2;
const MAX_PHOTO_SCALE = 4;
const PHOTO_SCALE_STEP = 0.1;

const PhotoTesting = () => {
  const [state, dispatch] = usePhotoTestingState();
  const { tokenNo, formData } = state;
  const [photoScale, setPhotoScale] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [arrows, setArrows] = useState([]);

  const { handleTokenSearch, resetForm } = useTokenSearch(dispatch);

  // Initialize progressive loading for development insights
  const progressiveLoading = useProgressiveLoading([
    { name: 'PhotoTestingLayout', loader: componentDefinitions.PhotoTestingLayout.loader },
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTokenSearch(tokenNo);
    }
  };

  const handleTokenNoChange = useCallback((value) => {
    dispatch({ type: 'SET_TOKEN_NO', payload: value });
  }, [dispatch]);

  const handlePhotoChange = useCallback((file) => {
    if (!file) {
      dispatch({ type: 'UPDATE_FORM_DATA', payload: { photoUrl: null } });
      setPhotoScale(1);
      setArrows([]);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (PNG, JPG or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      dispatch({ type: 'UPDATE_FORM_DATA', payload: { photoUrl: event.target.result } });
      setPhotoScale(1);
      setArrows(createDefaultArrows());
    };
    reader.onerror = () => alert('Could not read the selected file.');
    reader.readAsDataURL(file);
  }, [dispatch]);

  // Clear annotations whenever the photo is gone (e.g. after a token reset).
  useEffect(() => {
    if (!formData.photoUrl) setArrows([]);
  }, [formData.photoUrl]);

  const handleArrowChange = useCallback((id, patch) => {
    setArrows((prev) => prev.map((arrow) => (arrow.id === id ? { ...arrow, ...patch } : arrow)));
  }, []);

  const handleZoomIn = useCallback(() => {
    setPhotoScale((scale) => Math.min(MAX_PHOTO_SCALE, Math.round((scale + PHOTO_SCALE_STEP) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPhotoScale((scale) => Math.max(MIN_PHOTO_SCALE, Math.round((scale - PHOTO_SCALE_STEP) * 100) / 100));
  }, []);

  const handleOpenEditor = useCallback(() => {
    if (!formData.photoUrl) return;
    setEditorOpen(true);
  }, [formData.photoUrl]);

  const handleApplyEdited = useCallback((dataUrl) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: { photoUrl: dataUrl } });
    setPhotoScale(1);
    setEditorOpen(false);
  }, [dispatch]);

  const handlePrint = useCallback(async () => {
    try {
      const { printPhotoData } = await loadUtility('printUtils');

      const printData = {
        ...formData,
        tokenNo,
        photoUrl: formData.photoUrl || null,
        photoScale,
        arrows,
        date: new Date().toISOString()
      };

      printPhotoData(printData);
    } catch (error) {
      console.error('Error preparing print data:', error);
      alert('Error preparing print data. Please try again.');
    }
  }, [formData, tokenNo, photoScale, arrows]);

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
        onPhotoChange={handlePhotoChange}
        photoScale={photoScale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onEditImage={handleOpenEditor}
        arrows={arrows}
        onArrowChange={handleArrowChange}
        // Pass enhanced lazy-loaded components with fallbacks
        components={{
          TestResultForm: TestResultFormWithFallback,
          TokenSearchForm: TokenSearchFormWithFallback,
          Header: HeaderWithFallback,
          GridOverlay: GridOverlayWithFallback
        }}
        // Progressive loading state for development insights
        loadingState={progressiveLoading.loadingState}
      />

      {/* Photo Studio editor overlay */}
      {editorOpen && formData.photoUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/60 sm:p-4">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white shadow-2xl sm:rounded-xl">
            <Suspense fallback={<LoadingFallback progress={0} />}>
              <LazyPhotoStudioEditor
                embedded
                initialFile={formData.photoUrl}
                onApply={handleApplyEdited}
                onClose={() => setEditorOpen(false)}
              />
            </Suspense>
          </div>
        </div>
      )}


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
