/**
 * Advanced webpack configuration helper for PhotoTesting module optimization
 * Provides granular control over code splitting and chunk optimization
 */

import { defineConfig } from 'vite';

/**
 * PhotoTesting-specific chunk optimization
 */
export const getPhotoTestingChunkConfig = () => ({
  // Separate critical image processing utilities
  'image-processing-core': [
    'src/pages/PhotoTesting/utils/excelQualityCapture.js',
    'src/pages/PhotoTesting/utils/imageCapture.js'
  ],
  
  // Separate heavy image optimization utilities
  'image-processing-heavy': [
    'src/pages/PhotoTesting/utils/pixelPerfectCapture.js',
    'src/pages/PhotoTesting/utils/printImageOptimizer.js'
  ],
  
  // Separate print utilities
  'print-utilities': [
    'src/pages/PhotoTesting/utils/printUtils.js'
  ],
  
  // Separate UI components
  'photo-ui-components': [
    'src/pages/PhotoTesting/components/ImageEditor.jsx',
    'src/pages/PhotoTesting/components/ImageAdjustmentPanel.jsx'
  ],
  
  // Separate form components
  'photo-form-components': [
    'src/pages/PhotoTesting/components/TestResultForm.jsx',
    'src/pages/PhotoTesting/components/TokenSearchForm.jsx'
  ],
  
  // Separate layout components
  'photo-layout-components': [
    'src/pages/PhotoTesting/components/PhotoTestingLayout.jsx',
    'src/pages/PhotoTesting/components/Header.jsx',
    'src/pages/PhotoTesting/components/GridOverlay.jsx'
  ]
});

/**
 * Performance-focused build configuration
 */
export const photoTestingBuildConfig = {
  // Optimize chunk size warnings
  chunkSizeWarningLimit: 800, // Reduced from default 1000kb
  
  rollupOptions: {
    output: {
      manualChunks(id) {
        // PhotoTesting specific chunking
        if (id.includes('pages/PhotoTesting')) {
          if (id.includes('utils/excel') || id.includes('utils/image')) {
            return 'photo-image-processing';
          }
          if (id.includes('utils/print')) {
            return 'photo-print-utils';
          }
          if (id.includes('components/')) {
            return 'photo-components';
          }
          if (id.includes('hooks/')) {
            return 'photo-hooks';
          }
        }
        
        // Vendor splitting optimizations
        if (id.includes('lucide-react')) {
          return 'icons';
        }
        if (id.includes('react-router')) {
          return 'router';
        }
        if (id.includes('chart')) {
          return 'charts';
        }
        
        // Large node_modules into separate chunks
        if (id.includes('node_modules')) {
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('@tremor') || id.includes('recharts')) {
            return 'chart-vendor';
          }
          return 'vendor';
        }
      },
      
      // Optimize asset handling
      assetFileNames: (assetInfo) => {
        const info = assetInfo.name.split('.');
        const ext = info[info.length - 1];
        
        if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
          return `assets/images/[name]-[hash][extname]`;
        }
        if (/css/i.test(ext)) {
          return `assets/css/[name]-[hash][extname]`;
        }
        return `assets/[name]-[hash][extname]`;
      },
      
      // Optimize chunk naming
      chunkFileNames: (chunkInfo) => {
        const facadeModuleId = chunkInfo.facadeModuleId 
          ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '')
          : 'chunk';
        return `assets/js/${facadeModuleId}-[hash].js`;
      }
    }
  },
  
  // Terser optimization for production
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true, // Remove console.logs in production
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
      passes: 2 // Multiple compression passes
    },
    mangle: {
      safari10: true // Safari 10+ compatibility
    },
    format: {
      comments: false // Remove comments
    }
  }
};

/**
 * Performance monitoring plugin
 */
export const performanceAnalysisPlugin = () => ({
  name: 'performance-analysis',
  generateBundle(options, bundle) {
    const chunkSizes = {};
    let totalSize = 0;
    
    Object.keys(bundle).forEach(fileName => {
      const chunk = bundle[fileName];
      if (chunk.type === 'chunk') {
        const size = new Blob([chunk.code]).size;
        chunkSizes[fileName] = {
          size: size,
          sizeKB: Math.round(size / 1024),
          modules: chunk.modules ? Object.keys(chunk.modules).length : 0
        };
        totalSize += size;
      }
    });
    
    console.log('\n📊 PhotoTesting Bundle Analysis:');
    console.table(chunkSizes);
    console.log(`\n📦 Total bundle size: ${Math.round(totalSize / 1024)} KB`);
    
    // Performance warnings
    Object.entries(chunkSizes).forEach(([fileName, info]) => {
      if (info.sizeKB > 500) {
        console.warn(`⚠️  Large chunk detected: ${fileName} (${info.sizeKB} KB)`);
      }
    });
  }
});

/**
 * Preload optimization for critical resources
 */
export const generatePreloadTags = (criticalChunks = []) => {
  return criticalChunks.map(chunk => 
    `<link rel="preload" href="${chunk}" as="script" crossorigin>`
  ).join('\n');
};

/**
 * Service worker cache strategies for PhotoTesting assets
 */
export const photoTestingCacheStrategy = {
  // Cache image processing utilities aggressively
  imageProcessing: {
    strategy: 'CacheFirst',
    cacheName: 'photo-image-processing-v1',
    maxEntries: 10,
    maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
  },
  
  // Cache components with network-first for updates
  components: {
    strategy: 'NetworkFirst',
    cacheName: 'photo-components-v1',
    maxEntries: 20,
    maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
  },
  
  // Cache print utilities with stale-while-revalidate
  printUtils: {
    strategy: 'StaleWhileRevalidate',
    cacheName: 'photo-print-utils-v1',
    maxEntries: 5,
    maxAgeSeconds: 24 * 60 * 60 // 1 day
  }
};