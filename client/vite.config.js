import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom inline plugin to handle tailwind without external package
const tailwindInline = {
  name: 'tailwind-inline',
  transform(code, id) {
    if (id.endsWith('.css') && code.includes('@tailwind')) {
      return {
        code: code,
        map: null
      };
    }
  }
};

export default defineConfig({
  plugins: [react(), tailwindInline],
})
