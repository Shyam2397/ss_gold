import React, { Suspense, memo } from 'react';

// Create a more robust loading spinner
const LoadingSpinner = memo(() => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
    <span className="ml-2 text-amber-700">Loading...</span>
  </div>
));

// Create a wrapper for lazy loaded components with better error handling
const LazyComponentWrapper = (Component, displayName) => {
  const WrappedComponent = memo((props) => (
    <Suspense fallback={<LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  ));
  
  WrappedComponent.displayName = displayName;
  return WrappedComponent;
};

// Lazy load components with more specific chunk names for better debugging
const LazyFormField = React.lazy(() => 
  import(/* webpackChunkName: "token-form-field" */ './FormField')
);

const LazyFormSelect = React.lazy(() => 
  import(/* webpackChunkName: "token-form-select" */ './FormSelect')
);

const LazyTokenTable = React.lazy(() => 
  import(/* webpackChunkName: "token-table" */ './TokenTable')
);

const LazyDeleteConfirmationModal = React.lazy(() => 
  import(/* webpackChunkName: "token-delete-modal" */ './DeleteConfirmationModal')
);

// Create wrapped components
const FormField = LazyComponentWrapper(LazyFormField, 'FormField');
const FormSelect = LazyComponentWrapper(LazyFormSelect, 'FormSelect');
const TokenTable = LazyComponentWrapper(LazyTokenTable, 'TokenTable');
const DeleteConfirmationModal = LazyComponentWrapper(LazyDeleteConfirmationModal, 'DeleteConfirmationModal');

// Export all components
export { FormField, FormSelect, TokenTable, DeleteConfirmationModal, LoadingSpinner };