import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    tanstackStart({
      router: {
        routeFileIgnorePattern: '.+', // Ignore all files to effectively disable file-based routing logic for now
      },
    }),
    cloudflare(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './src/shared'),
      '@auth': resolve(__dirname, './src/features/auth'),
      '@tenants': resolve(__dirname, './src/features/tenants'),
      '@users': resolve(__dirname, './src/features/users'),
    },
  },
  server: {
    port: 5173,
    // No proxy needed - using subdomain (api.khhub.app) instead of /api prefix
  },
});
