/**
 * Webpack Configuration Helper for PhotoTesting Module
 * Provides optimal chunk splitting configuration
 */

export const photoTestingOptimization = {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      // PhotoTesting core components
      photoTestingCore: {
        test: /[\\/]PhotoTesting[\\/](components|hooks)[\\/]/,
        name: 'photo-testing-core',
        chunks: 'all',
        priority: 10,
        minSize: 0,
      },
      
      // PhotoTesting utilities
      photoTestingUtils: {
        test: /[\\/]PhotoTesting[\\/]utils[\\/]/,
        name: 'photo-testing-utils',
        chunks: 'async', // Only load when needed
        priority: 8,
        minSize: 0,
      },
      
      // High-priority components (Layout, ImageEditor)
      photoTestingHighPriority: {
        test: /[\\/]PhotoTesting[\\/]components[\\/](PhotoTestingLayout|ImageEditor)/,
        name: 'photo-testing-priority',
        chunks: 'all',
        priority: 15,
        minSize: 0,
      },
      
      // Form components
      photoTestingForms: {
        test: /[\\/]PhotoTesting[\\/]components[\\/](TestResultForm|TokenSearchForm)/,
        name: 'photo-testing-forms',
        chunks: 'async',
        priority: 6,
        minSize: 0,
      },
      
      // UI enhancement components
      photoTestingUI: {
        test: /[\\/]PhotoTesting[\\/]components[\\/](Header|GridOverlay|ImageAdjustmentPanel)/,
        name: 'photo-testing-ui',
        chunks: 'async',
        priority: 4,
        minSize: 0,
      }
    }
  }
};

export const photoTestingWebpackConfig = {
  optimization: photoTestingOptimization,
  resolve: {
    alias: {
      '@photo-testing': './src/pages/PhotoTesting'
    }
  }
};