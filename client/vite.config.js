import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: './',
    plugins: [react()],
    server: {
        port: 3000,
        open: true
    },
    worker: {
        format: 'es'
    },
    build: {
        chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('@tanstack/react-query')) {
                            return 'vendor';
                        }
                        if (id.includes('recharts') || id.includes('chart.js')) {
                            return 'charts';
                        }
                        if (id.includes('@heroicons') || id.includes('@tremor') || id.includes('framer-motion')) {
                            return 'ui';
                        }
                        if (id.includes('lodash') || id.includes('date-fns') || id.includes('axios')) {
                            return 'utils';
                        }
                        // Group other node_modules into a separate chunk
                        return 'vendor-other';
                    }
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]'
            }
        },
        // Minify the output
        minify: 'terser',
        // Enable gzip compression
        reportCompressedSize: true,
        // Disable source maps in production
        sourcemap: false
    },
    // Enable CSS code splitting
    css: {
        modules: {
            localsConvention: 'camelCaseOnly'
        }
    },
    // Optimize deps
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'],
        esbuildOptions: {
            // Enable tree shaking
            treeShaking: true
        }
    }
});
