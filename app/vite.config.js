import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [react()],
  resolve: {
    alias: {
      // Previously supplied by @base44/vite-plugin -- now explicit.
      '@': path.resolve(__dirname, './src'),
    },
  },
});
