import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: './',
    server: {
        host: '0.0.0.0',
        port: 5173,
        cors: true,
        proxy: {
            '/api': {
                target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1/fixlap',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    preview: {
        host: '0.0.0.0',
        port: 5173,
        cors: true,
        proxy: {
            '/api': {
                target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1/fixlap',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
        sourcemap: process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
        rollupOptions: {
            maxParallelFileOps: 128,
        },
    },
});
