import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Add server configuration for local development
  server: {
    // Configure proxy for local development to avoid CORS issues
    proxy: {
      // Forward /api requests to your backend during development
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    },
    // Show environment info on startup
    hmr: {
      overlay: true
    }
  },
  
  // Specify environment directory
  envDir: '.',
  
  // Build options
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Report build size stats
    reportCompressedSize: true
  },
  
  // Explicitly define env variable handling
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
})