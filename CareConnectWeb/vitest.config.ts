import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Unit, integration and accessibility tests run in jsdom (no browser needed)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx'],
      reporter: ['text', 'html'],
    },
  },
})
