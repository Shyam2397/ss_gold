import React, { Suspense, memo } from 'react';

// Lazy load components
const LazyFormField = React.lazy(() => import('./FormField'));
const LazyFormSelect = React.lazy(() => import('./FormSelect'));
const LazyTokenTable = React.lazy(() => import('./TokenTable'));
const LazyDeleteConfirmationModal = React.lazy(() => import('./DeleteConfirmationModal'));

// Loading fallback component
const LoadingSpinner = memo(() => (
  <div className="flex justify-center p-4">
    <svg className="animate-spin h-5 w-5 text-amber-600" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  </div>
));

// Wrapper components with Suspense
const FormField = memo((props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyFormField {...props} />
  </Suspense>
));

const FormSelect = memo((props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyFormSelect {...props} />
  </Suspense>
));

const TokenTable = memo((props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyTokenTable {...props} />
  </Suspense>
));

const DeleteConfirmationModal = memo((props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyDeleteConfirmationModal {...props} />
  </Suspense>
));

// Export memoized components
export { FormField, FormSelect, TokenTable, DeleteConfirmationModal, LoadingSpinner };