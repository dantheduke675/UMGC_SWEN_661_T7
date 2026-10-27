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
    // Bound simultaneous jsdom/V8 instances on laptops and Windows hosts.
    maxWorkers: 2,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'html', 'json', 'json-summary', 'lcov'],
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
  },
})
