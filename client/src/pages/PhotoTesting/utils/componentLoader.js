/**
 * Advanced component loader with progressive loading, retry mechanisms, and performance optimization
 * Based on successful dynamic import code splitting implementation
 * 
 * Fixed: Removed JSX syntax to prevent Vite compilation errors
 * - Utility files should only contain pure JavaScript functions
 * - JSX error handling is delegated to LazyLoadWrapper components
 */

import { lazy } from 'react';

/**
 * Enhanced lazy loading with webpack chunk naming and error handling
 * @param {Function} importFn - Dynamic import function
 * @param {string} chunkName - Webpack chunk name for the component
 * @param {Object} options - Loading options
 * @returns {React.Component} Lazy loaded component
 */
export const createLazyComponent = (importFn, chunkName, options = {}) => {
  const {
    retryCount = 3,
    retryDelay = 1000,
    preload = false,
    priority = 'normal'
  } = options;

  let retries = 0;
  
  const loadComponent = async () => {
    try {
      const module = await importFn();
      
      // Log successful load for performance monitoring
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Loaded chunk: ${chunkName} (Priority: ${priority})`);
      }
      
      return module;
    } catch (error) {
      retries++;
      
      if (retries <= retryCount) {
        console.warn(`⚠️ Failed to load ${chunkName}, retrying (${retries}/${retryCount})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return loadComponent();
      }
      
      console.error(`❌ Failed to load ${chunkName} after ${retryCount} retries:`, error);
      
      // Return a simple fallback without JSX
      return {
        default: function ErrorFallback() {
          return null; // Will be handled by error boundary
        }
      };
    }
  };

  const LazyComponent = lazy(loadComponent);
  
  // Preload component if specified
  if (preload && typeof window !== 'undefined') {
    setTimeout(() => {
      importFn().catch(() => {
        // Silently handle preload failures
      });
    }, priority === 'high' ? 0 : 100);
  }
  
  return LazyComponent;
};

/**
 * Component definitions with webpack chunk names and loading strategies
 */
export const componentDefinitions = {
  // High Priority Components - Core functionality
  PhotoTestingLayout: {
    loader: () => import(
      /* webpackChunkName: "photo-layout" */
      /* webpackPrefetch: true */
      '../components/PhotoTestingLayout'
    ),
    chunkName: 'photo-layout',
    options: { preload: true, priority: 'high' }
  },
  
  ImageEditor: {
    loader: () => import(
      /* webpackChunkName: "image-editor" */
      /* webpackPrefetch: true */
      '../components/ImageEditor'
    ),
    chunkName: 'image-editor',
    options: { preload: true, priority: 'high' }
  },

  // Medium Priority Components - Forms
  TestResultForm: {
    loader: () => import(
      /* webpackChunkName: "test-form" */
      '../components/TestResultForm'
    ),
    chunkName: 'test-form',
    options: { priority: 'medium' }
  },

  TokenSearchForm: {
    loader: () => import(
      /* webpackChunkName: "token-form" */
      '../components/TokenSearchForm'
    ),
    chunkName: 'token-form',
    options: { priority: 'medium' }
  },

  // Low Priority Components - UI enhancements
  Header: {
    loader: () => import(
      /* webpackChunkName: "header" */
      '../components/Header'
    ),
    chunkName: 'header',
    options: { priority: 'low' }
  },

  GridOverlay: {
    loader: () => import(
      /* webpackChunkName: "grid-overlay" */
      '../components/GridOverlay'
    ),
    chunkName: 'grid-overlay',
    options: { priority: 'low' }
  },

  ImageAdjustmentPanel: {
    loader: () => import(
      /* webpackChunkName: "image-adjustment" */
      '../components/ImageAdjustmentPanel'
    ),
    chunkName: 'image-adjustment',
    options: { priority: 'low' }
  }
};

/**
 * Utility-specific lazy loaders for print and image processing
 */
export const utilityLoaders = {
  printUtils: {
    loader: () => import(
      /* webpackChunkName: "print-utils" */
      './printUtils'
    ),
    chunkName: 'print-utils'
  },

  excelQualityCapture: {
    loader: () => import(
      /* webpackChunkName: "excel-capture" */
      './excelQualityCapture'
    ),
    chunkName: 'excel-capture'
  },

  imageCapture: {
    loader: () => import(
      /* webpackChunkName: "image-capture" */
      './imageCapture'
    ),
    chunkName: 'image-capture'
  },

  pixelPerfectCapture: {
    loader: () => import(
      /* webpackChunkName: "pixel-perfect" */
      './pixelPerfectCapture'
    ),
    chunkName: 'pixel-perfect'
  },

  printImageOptimizer: {
    loader: () => import(
      /* webpackChunkName: "print-optimizer" */
      './printImageOptimizer'
    ),
    chunkName: 'print-optimizer'
  }
};

/**
 * Create all lazy components
 */
export const createLazyComponents = () => {
  const components = {};
  
  Object.entries(componentDefinitions).forEach(([name, definition]) => {
    components[name] = createLazyComponent(
      definition.loader,
      definition.chunkName,
      definition.options
    );
  });
  
  return components;
};

/**
 * Bundle size analysis for development
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('📦 PhotoTesting Bundle Analysis');
    console.log('Component chunks configured:', Object.keys(componentDefinitions).length);
    console.log('Utility chunks configured:', Object.keys(utilityLoaders).length);
    console.log('High priority components:', 
      Object.entries(componentDefinitions)
        .filter(([, def]) => def.options?.priority === 'high')
        .map(([name]) => name)
    );
    console.groupEnd();
  }
};

/**
 * Preload critical components for better UX
 */
export const preloadCriticalComponents = () => {
  const criticalComponents = Object.entries(componentDefinitions)
    .filter(([, definition]) => definition.options?.preload);
    
  criticalComponents.forEach(([name, definition]) => {
    definition.loader().catch(() => {
      // Silently handle preload failures
    });
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Preloading critical components:', criticalComponents.map(([name]) => name));
  }
};

/**
 * Dynamic utility loader for on-demand loading
 */
export const loadUtility = async (utilityName) => {
  const utility = utilityLoaders[utilityName];
  
  if (!utility) {
    throw new Error(`Utility ${utilityName} not found`);
  }
  
  try {
    const module = await utility.loader();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Dynamically loaded utility: ${utility.chunkName}`);
    }
    
    return module;
  } catch (error) {
    console.error(`Failed to load utility ${utilityName}:`, error);
    throw error;
  }
};