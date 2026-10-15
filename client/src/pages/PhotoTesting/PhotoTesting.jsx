import React, { useCallback, useEffect, Suspense } from 'react';
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


const PhotoTesting = () => {
  const [state, dispatch] = usePhotoTestingState();
  const { tokenNo, formData } = state;

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

  const handlePrint = useCallback(async () => {
    try {
      const { printPhotoData } = await loadUtility('printUtils');

      const printData = {
        ...formData,
        tokenNo,
        photoUrl: null,
        date: new Date().toISOString()
      };

      printPhotoData(printData);
    } catch (error) {
      console.error('Error preparing print data:', error);
      alert('Error preparing print data. Please try again.');
    }
  }, [formData, tokenNo]);

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
