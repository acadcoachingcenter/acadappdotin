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
      // @excalidraw/excalidraw's package.json exports map defines
      // "./index.css" only under "development"/"production" custom
      // conditions with no "default" fallback -- Rollup's production
      // build can't resolve that subpath on its own (confirmed by testing
      // the actual installed package). Point the import straight at the
      // built prod CSS file instead, bypassing exports-map resolution.
      '@excalidraw/excalidraw/index.css': path.resolve(
        __dirname,
        'node_modules/@excalidraw/excalidraw/dist/prod/index.css'
      ),
    },
  },
});
