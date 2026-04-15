import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
      },
      manifest: {
        name: 'BM Build Manage',
        short_name: 'BMBuild',
        description: 'Gestión Integral de Obras y Presupuestos',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // SEC-003: Strip console.* from production builds to prevent telemetry leaks
  esbuild: (() => {
    if (process.env.NODE_ENV === 'production') {
      return { drop: ['console', 'debugger'] } as unknown as false;
    }
    return false;
  })(),

  build: {
    // Disable source maps in production to prevent code exposure
    sourcemap: process.env.NODE_ENV !== 'production',

    // Minification settings for production hardening
    minify: 'esbuild',

    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@tanstack/react-query') || id.includes('node_modules/@tanstack/query-')) {
            return 'query-vendor';
          }
          if (id.includes('node_modules/@tanstack/react-table/')) {
            return 'table-vendor';
          }
          if (id.includes('node_modules/lucide-react/') || id.includes('node_modules/clsx/') || id.includes('node_modules/tailwind-merge/')) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/three/') || id.includes('node_modules/@thatopen/') || id.includes('node_modules/web-ifc/')) {
            return 'bim-vendor';
          }
          if (id.includes('node_modules/pdfjs-dist/') || id.includes('node_modules/pdfkit/')) {
            return 'pdf-vendor';
          }
          if (id.includes('node_modules/@react-pdf/')) {
            return 'react-pdf-vendor';
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'animation-vendor';
          }
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase-vendor';
          }
          return undefined;
        },
      },
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
    exclude: ['@thatopen/components', '@thatopen/fragments', 'three'],
  },
});