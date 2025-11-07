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
        manualChunks: {
          // Mantineを分割
          'mantine-core': ['@mantine/core'],
          'mantine-charts': ['@mantine/charts', 'recharts'],
          'mantine-other': ['@mantine/hooks', '@mantine/notifications', '@mantine/modals', '@mantine/dates', '@mantine/form', '@mantine/carousel'],
          // Firebaseを分割
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // React関連を分割
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // 警告の閾値を600KBに上げる
  },
})
