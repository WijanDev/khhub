import { beforeEach, vi } from 'vitest';
import type { Env } from '../types';

// Mock Cloudflare Workers environment
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();

  // Mock global fetch if needed
  globalThis.fetch = globalThis.fetch || vi.fn();
});

// Mock KVNamespace for testing
export function createMockKV(): KVNamespace {
  const store = new Map<string, { value: string; expiration?: number }>();

  return {
    get: vi.fn(async (key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream') => {
      const item = store.get(key);
      if (!item) return null;

      // Check expiration
      if (item.expiration && Date.now() / 1000 > item.expiration) {
        store.delete(key);
        return null;
      }

      if (type === 'json') {
        return JSON.parse(item.value);
      }
      return item.value;
    }),

    put: vi.fn(async (key: string, value: string, options?: { expirationTtl?: number; expiration?: number }) => {
      let expiration: number | undefined;

      if (options?.expiration) {
        expiration = options.expiration;
      } else if (options?.expirationTtl) {
        expiration = Math.floor(Date.now() / 1000) + options.expirationTtl;
      }

      store.set(key, { value, expiration });
    }),

    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),

    list: vi.fn(async (options?: { prefix?: string; limit?: number; cursor?: string }) => {
      const prefix = options?.prefix || '';
      const matchingKeys = Array.from(store.keys())
        .filter(key => key.startsWith(prefix))
        .slice(0, options?.limit || 1000);

      return {
        keys: matchingKeys.map(name => ({
          name,
          expiration: store.get(name)?.expiration,
          metadata: {},
        })),
        listComplete: true,
        cursor: '',
      };
    }),
  } as unknown as KVNamespace;
}

// Mock D1Database for testing
export function createMockD1(): D1Database {
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    })),
    exec: vi.fn(),
    batch: vi.fn(),
  } as unknown as D1Database;
}

// Helper to create mock environment
export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    ENVIRONMENT: 'test',
    CACHE: createMockKV(),
    DB: createMockD1(),
    ...overrides,
  } as Env;
}
