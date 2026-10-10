import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// The desktop app's real version lives in the repository root package.json
// (the client package keeps its own placeholder version). Read it so the
// dashboard/status bar can show the shipped build number.
let appVersion = '0.0.0';
try {
    const rootPkg = JSON.parse(
        readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
    );
    appVersion = rootPkg.version || appVersion;
} catch {
    // Keep the fallback when the file cannot be read (e.g. unusual checkout)
}

export default defineConfig({
    base: './',
    plugins: [react()],
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
    },
    server: {
        port: 3000,
        open: true
    },
    worker: {
        format: 'es'
    },
    build: {
        // The unpaid-customer statement is printed by the Electron main process,
        // which loads the HTML through a `data:` URL. A data: document has no base
        // path, so the logo has to be embedded as a base64 data URI - referenced as
        // /assets/logo.png it resolves to nothing and the statement header prints
        // blank, with no error. Returning undefined leaves every other asset on
        // Vite's default 4 KB threshold.
        assetsInlineLimit: (filePath) =>
            filePath.endsWith('logo.png') ? true : undefined,
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
