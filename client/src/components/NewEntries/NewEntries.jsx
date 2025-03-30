import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

const NewEntriesComponent = React.lazy(() => import('./index'));

const NewEntries = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <NewEntriesComponent />
  </Suspense>
);

export default NewEntries;
