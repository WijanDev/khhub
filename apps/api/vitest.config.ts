import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/test-utils/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'tests/test-utils/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@auth': path.resolve(__dirname, './src/features/auth'),
      '@cache': path.resolve(__dirname, './src/features/cache'),
      '@email': path.resolve(__dirname, './src/features/email'),
      '@storage': path.resolve(__dirname, './src/features/storage'),
      '@tenants': path.resolve(__dirname, './src/features/tenants'),
      '@users': path.resolve(__dirname, './src/features/users'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
