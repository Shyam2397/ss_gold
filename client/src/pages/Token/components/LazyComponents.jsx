import React, { Suspense } from 'react';

// Lazy load components
export const LazyFormField = React.lazy(() => import('./FormField'));
export const LazyFormSelect = React.lazy(() => import('./FormSelect'));
export const LazyTokenTable = React.lazy(() => import('./TokenTable'));
export const LazyDeleteConfirmationModal = React.lazy(() => import('./DeleteConfirmationModal'));

// Loading fallback component
export const LoadingSpinner = () => (
  <div className="flex justify-center p-4">
    <svg className="animate-spin h-5 w-5 text-amber-600" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  </div>
);

// Wrapper components with Suspense
export const FormField = (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyFormField {...props} />
  </Suspense>
);

export const FormSelect = (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyFormSelect {...props} />
  </Suspense>
);

export const TokenTable = (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyTokenTable {...props} />
  </Suspense>
);

export const DeleteConfirmationModal = (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyDeleteConfirmationModal {...props} />
  </Suspense>
);
