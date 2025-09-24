/**
 * Enhanced lazy loading wrapper with error boundaries and fallbacks
 * Based on successful dynamic import code splitting implementation
 */

import React, { Suspense, Component } from 'react';

/**
 * Error boundary for lazy-loaded components
 */
class LazyLoadErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LazyLoad Error Boundary caught an error:', error, errorInfo);
    
    // Log error for monitoring (could be sent to error tracking service)
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Lazy Loading Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallbackComponent: FallbackComponent, componentName = 'Component' } = this.props;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} componentName={componentName} />;
      }
      
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 font-semibold mb-2">
            Failed to load {componentName}
          </div>
          <div className="text-red-500 text-sm mb-4">
            {this.state.error?.message || 'Unknown error occurred'}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Enhanced loading spinner with progress and component info
 */
const EnhancedLoadingSpinner = ({ componentName, showProgress = false, progress = 0 }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      {showProgress && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-amber-600">
            {progress}%
          </span>
        </div>
      )}
    </div>
    {componentName && (
      <div className="mt-3 text-sm text-gray-600">
        Loading {componentName}...
      </div>
    )}
  </div>
);

/**
 * Skeleton loading component for better UX
 */
export const SkeletonLoader = ({ type = 'default', className = '' }) => {
  const skeletonClasses = "animate-pulse bg-gray-200 rounded";
  
  const skeletonTypes = {
    form: (
      <div className={`space-y-4 p-4 ${className}`}>
        <div className={`h-4 ${skeletonClasses} w-3/4`}></div>
        <div className={`h-10 ${skeletonClasses}`}></div>
        <div className={`h-4 ${skeletonClasses} w-1/2`}></div>
        <div className={`h-10 ${skeletonClasses}`}></div>
        <div className={`h-8 ${skeletonClasses} w-1/3`}></div>
      </div>
    ),
    
    imageEditor: (
      <div className={`p-4 ${className}`}>
        <div className={`h-64 ${skeletonClasses} mb-4`}></div>
        <div className="flex space-x-2">
          <div className={`h-8 w-8 ${skeletonClasses}`}></div>
          <div className={`h-8 w-8 ${skeletonClasses}`}></div>
          <div className={`h-8 w-8 ${skeletonClasses}`}></div>
        </div>
      </div>
    ),
    
    header: (
      <div className={`p-4 ${className}`}>
        <div className={`h-16 ${skeletonClasses} w-full`}></div>
      </div>
    ),
    
    default: (
      <div className={`p-4 ${className}`}>
        <div className={`h-32 ${skeletonClasses} w-full`}></div>
      </div>
    )
  };
  
  return skeletonTypes[type] || skeletonTypes.default;
};

/**
 * Enhanced lazy wrapper with intelligent fallbacks
 */
export const withEnhancedLazyLoading = (
  LazyComponent,
  options = {}
) => {
  const {
    componentName = 'Component',
    fallbackType = 'default',
    showProgress = false,
    enableSkeleton = true,
    customFallback = null,
    errorFallback = null
  } = options;

  const LoadingFallback = ({ progress }) => {
    if (customFallback) {
      return customFallback;
    }
    
    if (enableSkeleton) {
      return <SkeletonLoader type={fallbackType} />;
    }
    
    return (
      <EnhancedLoadingSpinner
        componentName={componentName}
        showProgress={showProgress}
        progress={progress}
      />
    );
  };

  return (props) => (
    <LazyLoadErrorBoundary
      componentName={componentName}
      fallbackComponent={errorFallback}
    >
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};

/**
 * Smart fallback component that adapts based on component type
 */
export const SmartFallback = ({ componentType, error, componentName }) => {
  const fallbackMap = {
    form: <SkeletonLoader type="form" />,
    imageEditor: <SkeletonLoader type="imageEditor" />,
    header: <SkeletonLoader type="header" />,
    layout: (
      <div className="min-h-[700px] border-2 border-amber-100 bg-white p-6 m-4 rounded-xl flex items-center justify-center">
        <EnhancedLoadingSpinner componentName="Layout" />
      </div>
    )
  };

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-yellow-800 font-medium">
          {componentName} is temporarily unavailable
        </div>
        <div className="text-yellow-600 text-sm mt-1">
          Please try refreshing the page
        </div>
      </div>
    );
  }

  return fallbackMap[componentType] || <SkeletonLoader />;
};

/**
 * Progressive disclosure component for lazy loading
 */
export const ProgressiveDisclosure = ({ 
  children, 
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true 
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasTriggered, setHasTriggered] = React.useState(false);
  const ref = React.useRef();

  React.useEffect(() => {
    if (!ref.current || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasTriggered(true);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return (
    <div ref={ref}>
      {isVisible ? children : <SkeletonLoader />}
    </div>
  );
};