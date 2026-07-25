import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // user explicitly confirms updates — see Phase 3's update-prompt UI, rather than silently swapping the app under them
      // REQUIRED when using the React registration hook (virtual:pwa-register/react,
      // consumed in UpdatePrompt.tsx). Without this, vite-plugin-pwa ALSO
      // auto-injects its own registration script into index.html, causing
      // two independent navigator.serviceWorker.register() calls to race —
      // the hook is the single source of truth for registration here.
      injectRegister: false,
      includeAssets: ['favicon.ico', 'assets/LOGO.png', 'assets/pwa-192x192.png', 'assets/pwa-512x512.png', 'assets/pwa-maskable-512x512.png'],
      manifest: {
        name: 'CP Calendar Pro',
        short_name: 'CalNote',
        description: 'AI-powered scheduling, notes, and code execution for competitive programmers.',
        theme_color: '#15171F', // matches --color-bg-primary dark value
        background_color: '#15171F',
        display: 'standalone',
        start_url: '/home',
        scope: '/',
        icons: [
          { src: '/assets/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/assets/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Excludes favicon.svg from the precache manifest specifically —
        // it's currently ~2.5MB (almost certainly a bloated/unoptimized
        // export, not a genuine vector — see the note in README/issue
        // tracker to actually fix the source asset), which exceeds
        // Workbox's default 2 MiB precache ceiling and hard-fails the
        // build. Favicons don't need offline precaching at all — browsers
        // fetch/cache them via normal HTTP independently of the service
        // worker, so excluding it costs nothing functionally.
        globIgnores: ['**/favicon.svg'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],

        // Route-by-route runtime caching. Ordered most-specific-first,
        // since Workbox matches the FIRST rule whose urlPattern matches —
        // a broad /api/v1/ catch-all placed early would incorrectly catch
        // AI/code-execution/auth requests before their own "never cache"
        // rules get a chance to apply.
        runtimeCaching: [
          // NEVER CACHE: live AI generation, code execution, and auth.
          // NetworkOnly with no fallback — a failed request here should
          // fail visibly, not silently serve stale AI output or a stale
          // auth state.
          {
            urlPattern: ({ url }) =>
              /\/api\/v1\/(ai\/|code-execution\/|auth\/)/.test(url.pathname),
            handler: 'NetworkOnly',
          },

          // NETWORK-FIRST, short fallback: the user's own live data.
          // Prefer fresh, but tolerate a recent cached copy specifically
          // to survive a Render cold-start wake-up window rather than
          // showing a blank screen.
          {
            urlPattern: ({ url }) =>
              /\/api\/v1\/(events|notes|users\/me\/preferences)/.test(url.pathname),
            method: 'GET', // explicit, not relied-on-as-default: a PATCH to /users/me/preferences
                            // must NEVER be intercepted by a caching strategy — that would
                            // silently resurrect the sleep-window-not-saving bug fixed earlier.
            handler: 'NetworkFirst',
            options: {
              cacheName: 'user-data-cache',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },

          // STALE-WHILE-REVALIDATE: contest list. Instant from cache,
          // silently refreshed in the background — appropriate because
          // this data only changes server-side every 30 minutes anyway.
          {
            urlPattern: ({ url }) => /\/api\/v1\/contests/.test(url.pathname),
            method: 'GET',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'contests-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 10 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },

          // Static assets (logo, icons) — long-lived, safe to cache aggressively.
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
            method: 'GET',
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // allows testing the service worker during `npm run dev`, not just production builds
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});