import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

export const lazyLoad = (importFn) => {
  const LazyComponent = React.lazy(() => 
    importFn().catch(error => {
      console.error('Failed to load component:', error);
      return { default: () => <div>Failed to load component.</div> };
    })
  );

  return (props) => (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export const withLazyLoading = (Component, fallback = <LoadingSpinner />) => {
  return (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};
