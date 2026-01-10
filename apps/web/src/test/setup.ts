import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(globalThis.window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  disconnect() {
    // Mocked method
  }
  observe() {
    // Mocked method
  }
  takeRecords() {
    return [];
  }
  unobserve() {
    // Mocked method
  }
} as any;

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  disconnect() {
    // Mocked method
  }
  observe() {
    // Mocked method
  }
  unobserve() {
    // Mocked method
  }
} as any;
