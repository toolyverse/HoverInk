/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Disable react plugin during tests to avoid @react-refresh resolution error
    // with the old @vitejs/plugin-react v2
    ...(process.env.VITEST ? [] : [react()]),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
