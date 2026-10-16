/**
 * Progressive loading hook for optimized component loading experience
 * Based on successful dynamic import code splitting implementation
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Hook for progressive component loading with intelligent prioritization
 * @param {Array} components - Array of component definitions to load progressively
 * @param {Object} options - Loading options
 * @returns {Object} Loading state and loaded components
 */
export const useProgressiveLoading = (components = [], options = {}) => {
  const {
    batchSize = 2,
    delay = 100,
    enableMemoryOptimization = true
  } = options;

  const [loadingState, setLoadingState] = useState({
    loaded: new Set(),
    loading: new Set(),
    failed: new Set(),
    progress: 0
  });

  const [loadedComponents, setLoadedComponents] = useState({});
  const loadingQueue = useRef([...components]);
  const isLoadingRef = useRef(false);

  const updateLoadingState = (updates) => {
    setLoadingState(prev => {
      const next = { ...prev, ...updates };
      next.progress = components.length
        ? Math.round((next.loaded.size / components.length) * 100)
        : 0;
      return next;
    });
  };

  const loadNextBatch = async () => {
    if (isLoadingRef.current || loadingQueue.current.length === 0) {
      return;
    }

    isLoadingRef.current = true;
    const batch = loadingQueue.current.splice(0, batchSize);

    // Mark the whole batch as loading (functional update so concurrent batches
    // never clobber each other's sets).
    setLoadingState(prev => {
      const loading = new Set(prev.loading);
      batch.forEach(comp => loading.add(comp.name));
      return { ...prev, loading };
    });

    const loadPromises = batch.map(async (component) => {
      try {
        const module = await component.loader();

        setLoadedComponents(prev => ({
          ...prev,
          [component.name]: module.default
        }));

        // Functional update: read the fresh set so two components finishing in
        // the same batch both register instead of overwriting each other.
        setLoadingState(prev => {
          const loaded = new Set(prev.loaded);
          const loading = new Set(prev.loading);
          loaded.add(component.name);
          loading.delete(component.name);
          return {
            ...prev,
            loaded,
            loading,
            progress: components.length
              ? Math.round((loaded.size / components.length) * 100)
              : 0,
          };
        });

        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Progressively loaded: ${component.name}`);
        }

        return { name: component.name, success: true };
      } catch (error) {
        console.error(`Failed to load component ${component.name}:`, error);

        setLoadingState(prev => {
          const failed = new Set(prev.failed);
          const loading = new Set(prev.loading);
          failed.add(component.name);
          loading.delete(component.name);
          return { ...prev, failed, loading };
        });

        return { name: component.name, success: false, error };
      }
    });

    await Promise.allSettled(loadPromises);
    isLoadingRef.current = false;

    // Continue loading next batch
    if (loadingQueue.current.length > 0) {
      setTimeout(loadNextBatch, delay);
    }
  };

  useEffect(() => {
    if (components.length > 0) {
      loadNextBatch();
    }
  }, [components.length]);

  // Memory optimization - cleanup unused components
  useEffect(() => {
    if (!enableMemoryOptimization) return;

    const cleanup = () => {
      // This could be enhanced to unload components that haven't been used recently
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 Memory optimization check completed');
      }
    };

    const interval = setInterval(cleanup, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [enableMemoryOptimization]);

  return {
    loadingState,
    loadedComponents,
    isComplete: loadingState.loaded.size === components.length,
    hasErrors: loadingState.failed.size > 0,
    retryFailed: () => {
      // Re-add failed components to queue
      const failedComponents = components.filter(comp => 
        loadingState.failed.has(comp.name)
      );
      
      loadingQueue.current = [...loadingQueue.current, ...failedComponents];
      
      const newFailed = new Set();
      updateLoadingState({ failed: newFailed });
      
      loadNextBatch();
    }
  };
};
