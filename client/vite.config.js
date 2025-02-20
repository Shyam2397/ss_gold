import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: process.env.ELECTRON=="true" ? './' : '/',
    server: {
        port: 3000,
        open: true
    },
    build: {
        outDir: 'dist',
        assetsDir: '.',
        rollupOptions: {
            output: {
                format: 'es'
            }
        }
    }
});
