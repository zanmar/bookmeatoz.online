import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Using SWC for faster builds
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173, // Default Vite port
    proxy: {
      // Proxy API requests to the backend during development
      // Adjust if your backend runs on a different port or path
      '/api': {
        target: 'http://localhost:8083', // Your backend port
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api\/v1/, '') // if backend base is not /api/v1
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Generate source maps for production build if needed for debugging
  },
});
