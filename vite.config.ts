import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('@mantine/')) return 'mantine';
          if (id.includes('recharts')) return 'mantine';
          if (id.includes('firebase/')) return 'firebase';
          if (id.includes('react-router')) return 'react-vendor';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
        },
      },
    },
    chunkSizeWarningLimit: 600, // 警告の閾値を600KBに上げる
  },
})
