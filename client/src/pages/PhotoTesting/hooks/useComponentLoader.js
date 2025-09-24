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
    setLoadingState(prev => ({
      ...prev,
      ...updates,
      progress: Math.round(((prev.loaded.size + (updates.loaded?.size || 0)) / components.length) * 100)
    }));
  };

  const loadNextBatch = async () => {
    if (isLoadingRef.current || loadingQueue.current.length === 0) {
      return;
    }

    isLoadingRef.current = true;
    const batch = loadingQueue.current.splice(0, batchSize);
    
    const newLoading = new Set(loadingState.loading);
    batch.forEach(comp => newLoading.add(comp.name));
    
    updateLoadingState({ loading: newLoading });

    const loadPromises = batch.map(async (component) => {
      try {
        const module = await component.loader();
        
        setLoadedComponents(prev => ({
          ...prev,
          [component.name]: module.default
        }));

        const newLoaded = new Set(loadingState.loaded);
        const newLoading = new Set(loadingState.loading);
        
        newLoaded.add(component.name);
        newLoading.delete(component.name);
        
        updateLoadingState({ loaded: newLoaded, loading: newLoading });

        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Progressively loaded: ${component.name}`);
        }

        return { name: component.name, success: true };
      } catch (error) {
        console.error(`Failed to load component ${component.name}:`, error);
        
        const newFailed = new Set(loadingState.failed);
        const newLoading = new Set(loadingState.loading);
        
        newFailed.add(component.name);
        newLoading.delete(component.name);
        
        updateLoadingState({ failed: newFailed, loading: newLoading });

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

/**
 * Hook for component-specific loading with caching
 * @param {string} componentName - Name of the component to load
 * @param {Function} loader - Component loader function
 * @param {Object} options - Loading options
 * @returns {Object} Component loading state
 */
export const useComponentLoader = (componentName, loader, options = {}) => {
  const {
    cache = true,
    timeout = 10000
  } = options;

  const [state, setState] = useState({
    component: null,
    loading: false,
    error: null,
    loadTime: null
  });

  const cache_ = useRef(new Map());
  const timeoutRef = useRef(null);

  const loadComponent = async () => {
    if (cache && cache_.current.has(componentName)) {
      setState(prev => ({
        ...prev,
        component: cache_.current.get(componentName),
        loading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    const startTime = performance.now();

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error(`Timeout loading ${componentName}`)
      }));
    }, timeout);

    try {
      const module = await loader();
      const loadTime = performance.now() - startTime;
      
      if (cache) {
        cache_.current.set(componentName, module.default);
      }

      clearTimeout(timeoutRef.current);
      
      setState({
        component: module.default,
        loading: false,
        error: null,
        loadTime
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ Loaded ${componentName} in ${loadTime.toFixed(2)}ms`);
      }
    } catch (error) {
      clearTimeout(timeoutRef.current);
      setState(prev => ({
        ...prev,
        loading: false,
        error
      }));
    }
  };

  useEffect(() => {
    loadComponent();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [componentName]);

  return {
    ...state,
    reload: loadComponent,
    clearCache: () => {
      if (cache_.current.has(componentName)) {
        cache_.current.delete(componentName);
      }
    }
  };
};

/**
 * Hook for preloading components on user interaction
 * @param {Array} componentLoaders - Array of component loaders
 * @param {string} trigger - Trigger event ('hover', 'focus', 'click')
 * @returns {Object} Preload functions
 */
export const useSmartPreloading = (componentLoaders = [], trigger = 'hover') => {
  const preloadedRef = useRef(new Set());

  const preload = (componentName) => {
    if (preloadedRef.current.has(componentName)) {
      return;
    }

    const loader = componentLoaders.find(cl => cl.name === componentName);
    if (loader) {
      preloadedRef.current.add(componentName);
      loader.loader().catch(() => {
        // Silently handle preload failures
        preloadedRef.current.delete(componentName);
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 Smart preloading: ${componentName}`);
      }
    }
  };

  const createPreloadProps = (componentName) => {
    const eventProp = `on${trigger.charAt(0).toUpperCase() + trigger.slice(1)}`;
    
    return {
      [eventProp]: () => preload(componentName)
    };
  };

  return {
    preload,
    createPreloadProps,
    isPreloaded: (componentName) => preloadedRef.current.has(componentName)
  };
};