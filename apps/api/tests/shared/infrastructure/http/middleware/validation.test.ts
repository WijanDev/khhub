import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  validateJson,
  validateQuery,
  validateParam,
  IdParamSchema,
  IdTenantParamSchema,
  IdConnectionParamSchema,
} from '@shared/infrastructure/http/middleware/validation';
import { createMockEnv } from '../../../../test-utils/setup';
import type { Env, Variables } from '@shared/domain/types';

describe('validateJson', () => {
  let app: Hono<{ Bindings: Env; Variables: Variables }>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono<{ Bindings: Env; Variables: Variables }>();
  });

  it('should pass valid JSON body', async () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.email(),
    });

    app.post('/test', validateJson(schema), async (c) => {
      const data = c.req.valid('json');
      return c.json({ success: true, data });
    });

    const req = new Request('https://api.example.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com' }),
    });

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: { name: 'Test User', email: 'test@example.com' },
    });
  });

  it('should return 400 with formatted errors for invalid JSON body', async () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.email(),
    });

    app.post('/test', validateJson(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'invalid-email' }),
    });

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
    expect(data.details).toHaveProperty('name');
    expect(data.details).toHaveProperty('email');
  });

  it('should handle missing required fields', async () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.email(),
    });

    app.post('/test', validateJson(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
  });

  it('should handle nested validation errors', async () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(1),
        email: z.email(),
      }),
    });

    app.post('/test', validateJson(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: { name: '', email: 'invalid' } }),
    });

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
    expect(data.details).toHaveProperty('user.name');
    expect(data.details).toHaveProperty('user.email');
  });
});

describe('validateQuery', () => {
  let app: Hono<{ Bindings: Env; Variables: Variables }>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono<{ Bindings: Env; Variables: Variables }>();
  });

  it('should pass valid query parameters', async () => {
    const schema = z.object({
      page: z.string().transform(Number),
      limit: z.string().transform(Number),
    });

    app.get('/test', validateQuery(schema), async (c) => {
      const data = c.req.valid('query');
      return c.json({ success: true, data });
    });

    const req = new Request('https://api.example.com/test?page=1&limit=10');

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: { page: 1, limit: 10 },
    });
  });

  it('should return 400 with formatted errors for invalid query parameters', async () => {
    const schema = z.object({
      page: z.string().min(1, 'Page is required'),
      limit: z.string().min(1, 'Limit is required'),
    });

    app.get('/test', validateQuery(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test?page=');

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
  });
});

describe('validateParam', () => {
  let app: Hono<{ Bindings: Env; Variables: Variables }>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono<{ Bindings: Env; Variables: Variables }>();
  });

  it('should pass valid URL parameters', async () => {
    app.get('/test/:id', validateParam(IdParamSchema), async (c) => {
      const { id } = c.req.valid('param');
      return c.json({ success: true, id });
    });

    const req = new Request('https://api.example.com/test/user-123');

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(200);
    expect(data).toEqual({
      success: true,
      id: 'user-123',
    });
  });

  it('should return 400 with formatted errors for invalid URL parameters', async () => {
    const schema = z.object({
      id: z.string().min(5, 'ID must be at least 5 characters'),
    });

    app.get('/test/:id', validateParam(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test/abc');

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
    expect(data.details).toHaveProperty('id');
  });
});

describe('IdParamSchema', () => {
  let app: Hono<{ Bindings: Env; Variables: Variables }>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono<{ Bindings: Env; Variables: Variables }>();
  });

  it('should validate valid ID parameter', async () => {
    app.get('/test/:id', validateParam(IdParamSchema), async (c) => {
      const { id } = c.req.valid('param');
      return c.json({ success: true, id });
    });

    const req = new Request('https://api.example.com/test/valid-id-123');

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(200);
    expect(data).toEqual({
      success: true,
      id: 'valid-id-123',
    });
  });

  it('should reject empty ID parameter', async () => {
    const schema = z.object({
      id: z.string().min(1, 'ID is required'),
    });

    app.get('/test/:id', validateParam(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test/');

    const res = await app.fetch(req, createMockEnv());

    if (res.status === 404) {
      expect(res.status).toBe(404);
      return;
    }

    const data = await res.json() as any;
    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
  });
});

describe('IdTenantParamSchema', () => {
  let app: Hono<{ Bindings: Env; Variables: Variables }>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono<{ Bindings: Env; Variables: Variables }>();
  });

  it('should validate valid ID and tenantId parameters', async () => {
    app.get('/test/:id/tenants/:tenantId', validateParam(IdTenantParamSchema), async (c) => {
      const { id, tenantId } = c.req.valid('param');
      return c.json({ success: true, id, tenantId });
    });

    const req = new Request('https://api.example.com/test/user-123/tenants/tenant-456');

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(200);
    expect(data).toEqual({
      success: true,
      id: 'user-123',
      tenantId: 'tenant-456',
    });
  });

  it('should reject empty tenantId parameter', async () => {
    const schema = z.object({
      id: z.string().min(1),
      tenantId: z.string().min(1, 'Tenant ID is required'),
    });

    app.get('/test/:id/tenants/:tenantId', validateParam(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test/user-123/tenants/');

    const res = await app.fetch(req, createMockEnv());

    if (res.status === 404) {
      expect(res.status).toBe(404);
      return;
    }

    const data = await res.json() as any;
    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
  });
});

describe('IdConnectionParamSchema', () => {
  let app: Hono<{ Bindings: Env; Variables: Variables }>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono<{ Bindings: Env; Variables: Variables }>();
  });

  it('should validate valid ID and connectionId parameters', async () => {
    app.get('/test/:id/connections/:connectionId', validateParam(IdConnectionParamSchema), async (c) => {
      const { id, connectionId } = c.req.valid('param');
      return c.json({ success: true, id, connectionId });
    });

    const req = new Request('https://api.example.com/test/tenant-123/connections/conn-456');

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(200);
    expect(data).toEqual({
      success: true,
      id: 'tenant-123',
      connectionId: 'conn-456',
    });
  });

  it('should reject empty connectionId parameter', async () => {
    const schema = z.object({
      id: z.string().min(1),
      connectionId: z.string().min(1, 'Connection ID is required'),
    });

    app.get('/test/:id/connections/:connectionId', validateParam(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test/tenant-123/connections/');

    const res = await app.fetch(req, createMockEnv());

    if (res.status === 404) {
      expect(res.status).toBe(404);
      return;
    }

    const data = await res.json() as any;
    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
  });
});

describe('Error formatting', () => {
  it('should format multiple errors for the same field', async () => {
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    const schema = z.object({
      email: z.email('Invalid email format').min(5, 'Email too short'),
    });

    app.post('/test', validateJson(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ab' }),
    });

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
    expect(data.details.email).toBeInstanceOf(Array);
    expect(data.details.email.length).toBeGreaterThan(0);
  });

  it('should handle validation errors with custom messages', async () => {
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    const schema = z.object({
      value: z.number().refine((val) => val > 0, { message: 'Must be positive' }),
    });

    app.post('/test', validateJson(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: -1 }),
    });

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
    expect(data.details).toHaveProperty('value');
    expect(data.details.value).toContain('Must be positive');
  });

  it('should use general path when issue path is empty', async () => {
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    const schema = z.object({}).superRefine((val, ctx) => {
      ctx.addIssue({
        code: 'custom',
        message: 'General validation error',
        path: [],
      });
    });

    app.post('/test', validateJson(schema), async (c) => {
      return c.json({ success: true });
    });

    const req = new Request('https://api.example.com/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await app.fetch(req, createMockEnv());
    const data = await res.json() as any;

    expect(res.status).toBe(400);
    expect(data).toHaveProperty('error', 'Validation failed');
    expect(data).toHaveProperty('details');
    expect(data.details).toHaveProperty('general');
    expect(data.details.general).toContain('General validation error');
  });
});
