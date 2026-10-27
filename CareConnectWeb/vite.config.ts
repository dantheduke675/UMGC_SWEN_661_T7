import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// One HTML file per page; each is built into dist/ alongside the shared JS and CSS
const pages = ['index', 'signin', 'create-account', 'today', 'medications', 'messages', 'schedule', 'symptoms', 'account', '404']

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    rolldownOptions: {
      input: Object.fromEntries(pages.map(p => [p, resolve(import.meta.dirname, `${p}.html`)])),
      // React, React DOM and React Router in one chunk that stays cached between
      // app updates; each page is its own chunk (lazy routes in src/router.tsx)
      output: { codeSplitting: { groups: [{ name: 'vendor', test: /node_modules/ }] } },
    },
  },
  plugins: [
    react(),
    // npm run analyze: treemap of what each chunk contains, written outside dist/
    mode === 'analyze' && visualizer({ filename: 'bundle-stats.html', template: 'treemap', gzipSize: true, open: false }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Served as /manifest.json (the plugin's default name is manifest.webmanifest)
      manifestFilename: 'manifest.json',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'CareConnect',
        short_name: 'CareConnect',
        description:
          'Medication management and care coordination for you and your care team.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#357c6f',
        background_color: '#0e131d',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Every page's HTML file is precached; unknown URLs show the Not found page offline
        navigateFallback: '/404.html',
        // The landing photo is precached as WebP; its JPEG is only a fallback for browsers without WebP
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp}'],
        // Google Fonts: keep a copy so the app looks right offline
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
}))
