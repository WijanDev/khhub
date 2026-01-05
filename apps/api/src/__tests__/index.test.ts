import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testClient } from 'hono/testing';
import app from '../index';
import { createMockEnv, createMockKV } from '../test/setup';
import type { Env } from '../types';

vi.mock('../routes/auth', () => {
  const { Hono } = require('hono');
  return {
    default: new Hono().get('/test', (c: any) => c.json({ message: 'auth route' })),
  };
});

vi.mock('../routes/tenants', () => {
  const { Hono } = require('hono');
  return {
    default: new Hono().get('/test', (c: any) => c.json({ message: 'tenants route' })),
  };
});

vi.mock('../routes/users', () => {
  const { Hono } = require('hono');
  return {
    default: new Hono().get('/test', (c: any) => c.json({ message: 'users route' })),
  };
});

vi.mock('../routes/storage', () => {
  const { Hono } = require('hono');
  return {
    default: new Hono().get('/test', (c: any) => c.json({ message: 'storage route' })),
  };
});

describe('API Index', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = createMockEnv({
      ENVIRONMENT: 'test',
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return health status with environment', async () => {
      const response = await app.fetch(
        new Request('http://localhost/health'),
        mockEnv
      );

      const data = (await response.json()) as { status: string; timestamp: string; environment: string };
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.environment).toBe('test');
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it('should default to development when ENVIRONMENT is not set', async () => {
      const envWithoutEnvironment = createMockEnv({
        ENVIRONMENT: undefined,
      });

      const response = await app.fetch(
        new Request('http://localhost/health'),
        envWithoutEnvironment
      );
      const data = (await response.json()) as { environment: string };
      expect(data.environment).toBe('development');
    });
  });

  describe('Hello Endpoint', () => {
    it('should return hello message', async () => {
      const client = testClient(app, { env: mockEnv });
      const res = await (client as any).hello.$get();
      const data = (await res.json()) as { message: string };
      expect(res.status).toBe(200);
      expect(data).toEqual({ message: 'Hello from Hono API!' });
    });
  });

  describe('Cache Purge Endpoints', () => {
    it('should purge all cache successfully', async () => {
      const mockKV = createMockKV();
      await mockKV.put('khhub:test:1', JSON.stringify({ data: 'test1' }));
      await mockKV.put('khhub:test:2', JSON.stringify({ data: 'test2' }));

      const response = await app.fetch(
        new Request('http://localhost/cache/purge', { method: 'POST' }),
        createMockEnv({ CACHE: mockKV })
      );

      const data = (await response.json()) as { message: string; deletedCount: number };
      expect(response.status).toBe(200);
      expect(data.message).toBe('All cache purged successfully');
      expect(data.deletedCount).toBeGreaterThanOrEqual(0);
    });

    it('should purge cache by type', async () => {
      const mockKV = createMockKV();
      await mockKV.put('khhub:users:1', JSON.stringify({ id: '1' }));
      await mockKV.put('khhub:tenants:1', JSON.stringify({ id: '1' }));

      const response = await app.fetch(
        new Request('http://localhost/cache/purge/users', { method: 'POST' }),
        createMockEnv({ CACHE: mockKV })
      );

      const data = (await response.json()) as { message: string; deletedCount: number };
      expect(response.status).toBe(200);
      expect(data.message).toBe('users cache purged successfully');
    });

    it('should return 400 for invalid cache type', async () => {
      const response = await app.fetch(
        new Request('http://localhost/cache/purge/invalid', { method: 'POST' }),
        mockEnv
      );

      const data = (await response.json()) as { error: string };
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid cache type');
    });

    it('should reject non-POST requests', async () => {
      const getResponse = await app.fetch(
        new Request('http://localhost/cache/purge', { method: 'GET' }),
        mockEnv
      );
      expect([404, 405]).toContain(getResponse.status);
    });

    it('should handle errors when purging cache', async () => {
      const mockKV = createMockKV();
      const errorKV = {
        ...mockKV,
        list: vi.fn().mockRejectedValue(new Error('KV error')),
      } as unknown as KVNamespace;

      const response = await app.fetch(
        new Request('http://localhost/cache/purge', { method: 'POST' }),
        createMockEnv({ CACHE: errorKV })
      );

      const data = (await response.json()) as { error: string };
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to purge cache');
    });

    it('should handle errors when purging cache by type', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockKV = createMockKV();
      const errorKV = {
        ...mockKV,
        list: vi.fn().mockRejectedValue(new Error('KV error')),
      } as unknown as KVNamespace;

      const response = await app.fetch(
        new Request('http://localhost/cache/purge/users', { method: 'POST' }),
        createMockEnv({ CACHE: errorKV })
      );

      const data = (await response.json()) as { error: string };
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to purge cache');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error purging users cache:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('CORS Middleware', () => {
    it('should include CORS headers for allowed origins', async () => {
      const response = await app.fetch(
        new Request('http://localhost/health', {
          headers: { Origin: 'http://localhost:5173' },
        }),
        mockEnv
      );

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await app.fetch(
        new Request('http://localhost/health', {
          method: 'OPTIONS',
          headers: {
            Origin: 'http://localhost:5173',
            'Access-Control-Request-Method': 'GET',
          },
        }),
        mockEnv
      );

      expect([200, 204]).toContain(response.status);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await app.fetch(
        new Request('http://localhost/non-existent-route'),
        mockEnv
      );
      const data = (await response.json()) as { error: string };
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Not Found' });
    });
  });

  describe('Error Handler', () => {
    it('should call error handler and log error when route throws', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const originalDate = global.Date;
      const mockDate = vi.fn(() => {
        const date = new originalDate();
        date.toISOString = () => {
          throw new Error('Date error for handler test');
        };
        return date;
      });
      global.Date = mockDate as any;

      const response = await app.fetch(
        new Request('http://localhost/health'),
        mockEnv
      );

      const data = (await response.json()) as { error: string };
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal Server Error' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', expect.any(Error));
      
      global.Date = originalDate;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Route Mounting', () => {
    it('should mount all route modules', async () => {
      const routes = [
        { path: '/auth/test', expectedStatus: 200 },
        { path: '/tenants/test', expectedStatus: 200 },
        { path: '/users/test', expectedStatus: 200 },
        { path: '/storage/test', expectedStatus: 200 },
      ];

      for (const route of routes) {
        const response = await app.fetch(
          new Request(`http://localhost${route.path}`),
          mockEnv
        );
        expect(response.status).toBe(route.expectedStatus);
      }
    });
  });

  describe('API Exports', () => {
    it('should export app and apiRoutes', async () => {
      const module = await import('../index');
      expect(module).toHaveProperty('apiRoutes');
      expect(module).toHaveProperty('app');
      expect(module.apiRoutes).toBeDefined();
      expect(module.app).toBeDefined();
      expect(module.app).toBe(module.default);
    });
  });
});
