import { describe, it, expect, vi, beforeEach } from 'vitest';
import tenantsRoutes from '@tenants/infrastructure/http/router';
import { createMockEnv } from '../../../../test-utils/setup';

const mockGetOrSetCache = vi.fn();
const mockDeleteCache = vi.fn();
const mockInvalidateTenant = vi.fn();
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteDb = vi.fn();
const mockReturning = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockValues = vi.fn();

const mockQuery = {
  tenants: {
    findMany: mockFindMany,
    findFirst: mockFindFirst,
  },
  tenantConnections: {
    findMany: vi.fn(),
  },
};

const mockDb = {
  query: mockQuery,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDeleteDb,
};

vi.mock('../../../../../src/features/cache/infrastructure/kv-cache', async () => {
  const actual = await vi.importActual('../../../../../src/features/cache/infrastructure/kv-cache');
  return {
    ...actual,
    createCacheManager: vi.fn(() => ({
      getOrSet: mockGetOrSetCache,
      delete: mockDeleteCache,
      invalidateTenant: mockInvalidateTenant,
    })),
  };
});

vi.mock('../../../../../src/shared/infrastructure/db', async () => {
  const actual = await vi.importActual('../../../../../src/shared/infrastructure/db');
  return {
    ...actual,
    createDb: vi.fn(() => mockDb),
  };
});

vi.mock('../../../../../src/shared/infrastructure/http/middleware/validation', async () => {
  const actual = await vi.importActual('../../../../../src/shared/infrastructure/http/middleware/validation');
  const validData: { param?: any; json?: any } = {};

  return {
    ...actual,
    validateJson: vi.fn((schema) => async (c: any, next: any) => {
      const body = await c.req.json();
      const result = schema.safeParse(body);
      if (!result.success) {
        return c.json({ error: 'Validation failed', details: result.error }, 400);
      }
      validData.json = result.data;
      c.req.valid = vi.fn((type: string) => {
        if (type === 'json') return validData.json;
        if (type === 'param') return validData.param;
        return undefined;
      });
      return next();
    }),
    validateParam: vi.fn((schema) => async (c: any, next: any) => {
      const params = c.req.param();
      const result = schema.safeParse(params);
      if (!result.success) {
        return c.json({ error: 'Validation failed', details: result.error }, 400);
      }
      validData.param = result.data;
      c.req.valid = vi.fn((type: string) => {
        if (type === 'param') return validData.param;
        if (type === 'json') return validData.json;
        return undefined;
      });
      return next();
    }),
  };
});

describe('tenantsRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'test-id', name: 'Test Tenant', slug: 'test-tenant', status: 'active', createdAt: new Date(), updatedAt: new Date() }]);
    mockGetOrSetCache.mockImplementation(async (key, fetcher) => {
      return await fetcher();
    });

    const createWhereMock = vi.fn(() => {
      const whereResult: any = Promise.resolve(undefined);
      whereResult.returning = mockReturning;
      return whereResult;
    });

    mockWhere.mockReturnValue({ returning: mockReturning });
    mockSet.mockReturnValue({ where: createWhereMock });
    mockValues.mockReturnValue({ returning: mockReturning });
    mockUpdate.mockReturnValue({ set: mockSet });
    mockInsert.mockReturnValue({ values: mockValues });
    mockDeleteDb.mockReturnValue({ where: mockWhere });
  });

  describe('GET /', () => {
    it('should return all tenants successfully', async () => {
      const mockTenants = [
        { id: '1', name: 'Tenant 1', slug: 'tenant-1', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Tenant 2', slug: 'tenant-2', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      ];
      mockFindMany.mockResolvedValue(mockTenants);
      mockGetOrSetCache.mockImplementation(async (key, fetcher) => {
        return await fetcher();
      });

      const req = new Request('https://api.example.com/');
      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { tenants: Array<{ id: string; name: string; slug: string; status: string }> };

      expect(res.status).toBe(200);
      expect(data.tenants).toHaveLength(2);
      expect(data.tenants[0]).toMatchObject({
        id: '1',
        name: 'Tenant 1',
        slug: 'tenant-1',
        status: 'active',
      });
      expect(mockGetOrSetCache).toHaveBeenCalled();
      expect(mockFindMany).toHaveBeenCalled();
    });

    it('should handle errors when fetching tenants', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockFindMany.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/');
      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch tenants' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /:id', () => {
    it('should return tenant by ID successfully', async () => {
      const mockTenant = {
        id: 'tenant-123',
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        connections: [],
      };
      mockFindFirst.mockResolvedValue(mockTenant);
      mockGetOrSetCache.mockImplementation(async (key, fetcher) => {
        return await fetcher();
      });

      const req = new Request('https://api.example.com/tenant-123');
      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { tenant: { id: string; name: string; slug: string; status: string } };

      expect(res.status).toBe(200);
      expect(data.tenant).toMatchObject({
        id: 'tenant-123',
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'active',
      });
      expect(mockGetOrSetCache).toHaveBeenCalled();
      expect(mockFindFirst).toHaveBeenCalled();
    });

    it('should return 404 when tenant not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      const req = new Request('https://api.example.com/nonexistent');
      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'Tenant not found' });
    });

    it('should handle errors when fetching tenant', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockFindFirst.mockRejectedValue(new Error('Database error'));
      mockGetOrSetCache.mockImplementation(async (key, fetcher) => {
        return await fetcher();
      });

      const req = new Request('https://api.example.com/tenant-123');
      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch tenant' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('POST /', () => {
    it('should return 400 when validation fails', async () => {
      const req = new Request('https://api.example.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { error: string };

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error', 'Validation failed');
    });

    it('should create tenant successfully', async () => {
      const newTenant = { id: 'new-id', name: 'New Tenant', slug: 'new-tenant', status: 'active', createdAt: new Date(), updatedAt: new Date() };
      mockReturning.mockResolvedValue([newTenant]);
      mockDeleteCache.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Tenant', slug: 'new-tenant' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { message: string; tenant: { id: string; name: string; slug: string; status: string } };

      expect(res.status).toBe(201);
      expect(data.message).toBe('Tenant created');
      expect(data.tenant).toMatchObject({
        id: 'new-id',
        name: 'New Tenant',
        slug: 'new-tenant',
        status: 'active',
      });
      expect(mockInsert).toHaveBeenCalled();
      expect(mockDeleteCache).toHaveBeenCalled();
    });


    it('should handle errors when creating tenant', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Tenant', slug: 'new-tenant' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create tenant' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('PUT /:id', () => {
    it('should return 400 when validation fails', async () => {
      const req = new Request('https://api.example.com/invalid-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { error: string };

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error', 'Validation failed');
    });

    it('should update tenant successfully', async () => {
      const updatedTenant = { id: 'tenant-123', name: 'Updated Tenant', slug: 'test-tenant', status: 'active', createdAt: new Date(), updatedAt: new Date() };
      mockReturning.mockResolvedValue([updatedTenant]);
      mockDeleteCache.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/tenant-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Tenant' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { message: string; tenant: { id: string; name: string; slug: string; status: string } };

      expect(res.status).toBe(200);
      expect(data.message).toBe('Tenant updated');
      expect(data.tenant).toMatchObject({
        id: 'tenant-123',
        name: 'Updated Tenant',
        slug: 'test-tenant',
        status: 'active',
      });
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDeleteCache).toHaveBeenCalledTimes(3);
    });

    it('should return 404 when tenant not found', async () => {
      mockReturning.mockResolvedValue([]);

      const req = new Request('https://api.example.com/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Tenant' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'Tenant not found' });
    });


    it('should handle errors when updating tenant', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/tenant-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Tenant' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update tenant' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('DELETE /:id', () => {
    it('should delete tenant successfully', async () => {
      const deletedTenant = { id: 'tenant-123', name: 'Test Tenant', slug: 'test-tenant', status: 'active', createdAt: new Date(), updatedAt: new Date() };
      mockReturning.mockResolvedValue([deletedTenant]);
      mockInvalidateTenant.mockResolvedValue(5);
      mockDeleteCache.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/tenant-123', {
        method: 'DELETE',
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { message: string; tenant: { id: string; name: string; slug: string; status: string } };

      expect(res.status).toBe(200);
      expect(data.message).toBe('Tenant deleted');
      expect(data.tenant).toMatchObject({
        id: 'tenant-123',
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'active',
      });
      expect(mockDeleteDb).toHaveBeenCalled();
      expect(mockInvalidateTenant).toHaveBeenCalledWith('tenant-123');
    });

    it('should return 404 when tenant not found', async () => {
      mockReturning.mockResolvedValue([]);

      const req = new Request('https://api.example.com/nonexistent', {
        method: 'DELETE',
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'Tenant not found' });
    });

    it('should handle errors when deleting tenant', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/tenant-123', {
        method: 'DELETE',
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to delete tenant' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /:id/connections', () => {
    it('should return connections for tenant successfully', async () => {
      const mockConnections = [
        { id: 'conn-1', tenantId: 'tenant-123', name: 'Primary DB', dbType: 'd1', connectionString: 'db://...', isPrimary: true, status: 'active', createdAt: new Date(), updatedAt: new Date() },
      ];
      mockQuery.tenantConnections.findMany.mockResolvedValue(mockConnections);

      const req = new Request('https://api.example.com/tenant-123/connections');
      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { connections: Array<{ id: string; tenantId: string; name: string; dbType: string }> };

      expect(res.status).toBe(200);
      expect(data.connections).toHaveLength(1);
      expect(data.connections[0]).toMatchObject({
        id: 'conn-1',
        tenantId: 'tenant-123',
        name: 'Primary DB',
        dbType: 'd1',
      });
      expect(mockGetOrSetCache).toHaveBeenCalled();
    });

    it('should handle errors when fetching connections', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockGetOrSetCache.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/tenant-123/connections');
      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch connections' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('POST /:id/connections', () => {
    it('should return 400 when validation fails', async () => {
      const req = new Request('https://api.example.com/tenant-123/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { error: string };

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error', 'Validation failed');
    });

    it('should add connection successfully', async () => {
      const newConnection = {
        id: 'conn-new',
        tenantId: 'tenant-123',
        name: 'New Connection',
        dbType: 'd1',
        connectionString: 'db://...',
        isPrimary: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([newConnection]);
      mockDeleteCache.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/tenant-123/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Connection',
          db_type: 'd1',
          connection_string: 'db://...',
          is_primary: false,
        }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { message: string; connection: { id: string; tenantId: string; name: string; dbType: string; isPrimary: boolean } };

      expect(res.status).toBe(201);
      expect(data.message).toBe('Connection added');
      expect(data.connection).toMatchObject({
        id: 'conn-new',
        tenantId: 'tenant-123',
        name: 'New Connection',
        dbType: 'd1',
        isPrimary: false,
      });
      expect(mockInsert).toHaveBeenCalled();
      expect(mockDeleteCache).toHaveBeenCalledTimes(2);
    });

    it('should set connection as primary and unset others', async () => {
      const newConnection = {
        id: 'conn-new',
        tenantId: 'tenant-123',
        name: 'Primary Connection',
        dbType: 'd1',
        connectionString: 'db://...',
        isPrimary: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([newConnection]);
      mockDeleteCache.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/tenant-123/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Primary Connection',
          db_type: 'd1',
          connection_string: 'db://...',
          is_primary: true,
        }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { message: string; connection: { id: string; tenantId: string; name: string; dbType: string; isPrimary: boolean } };

      expect(res.status).toBe(201);
      expect(data.message).toBe('Connection added');
      expect(data.connection).toMatchObject({
        id: 'conn-new',
        tenantId: 'tenant-123',
        name: 'Primary Connection',
        dbType: 'd1',
        isPrimary: true,
      });
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });


    it('should handle errors when adding connection', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/tenant-123/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Connection',
          db_type: 'd1',
          connection_string: 'db://...',
        }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to add connection' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('PUT /:id/connections/:connectionId', () => {
    it('should return 400 when validation fails', async () => {
      const req = new Request('https://api.example.com/invalid-id/connections/invalid-conn', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { error: string };

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error', 'Validation failed');
    });

    it('should update connection successfully', async () => {
      const updatedConnection = {
        id: 'conn-123',
        tenantId: 'tenant-123',
        name: 'Updated Connection',
        dbType: 'd1',
        connectionString: 'db://updated',
        isPrimary: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([updatedConnection]);
      mockDeleteCache.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/tenant-123/connections/conn-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Connection',
          connection_string: 'db://updated',
        }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { message: string; connection: { id: string; tenantId: string; name: string; dbType: string; isPrimary: boolean } };

      expect(res.status).toBe(200);
      expect(data.message).toBe('Connection updated');
      expect(data.connection).toMatchObject({
        id: 'conn-123',
        tenantId: 'tenant-123',
        name: 'Updated Connection',
        dbType: 'd1',
        isPrimary: false,
      });
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDeleteCache).toHaveBeenCalledTimes(2);
    });

    it('should return 404 when connection not found', async () => {
      mockReturning.mockResolvedValue([]);

      const req = new Request('https://api.example.com/tenant-123/connections/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Connection' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'Connection not found' });
    });


    it('should handle errors when updating connection', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/tenant-123/connections/conn-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Connection' }),
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update connection' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('DELETE /:id/connections/:connectionId', () => {
    it('should delete connection successfully', async () => {
      const deletedConnection = {
        id: 'conn-123',
        tenantId: 'tenant-123',
        name: 'Test Connection',
        dbType: 'd1',
        connectionString: 'db://...',
        isPrimary: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([deletedConnection]);
      mockDeleteCache.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/tenant-123/connections/conn-123', {
        method: 'DELETE',
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { message: string; connection: { id: string; tenantId: string; name: string; dbType: string; isPrimary: boolean } };

      expect(res.status).toBe(200);
      expect(data.message).toBe('Connection deleted');
      expect(data.connection).toMatchObject({
        id: 'conn-123',
        tenantId: 'tenant-123',
        name: 'Test Connection',
        dbType: 'd1',
        isPrimary: false,
      });
      expect(mockDeleteDb).toHaveBeenCalled();
      expect(mockDeleteCache).toHaveBeenCalledTimes(2);
    });

    it('should return 404 when connection not found', async () => {
      mockReturning.mockResolvedValue([]);

      const req = new Request('https://api.example.com/tenant-123/connections/nonexistent', {
        method: 'DELETE',
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { error: string };

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'Connection not found' });
    });

    it('should handle errors when deleting connection', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/tenant-123/connections/conn-123', {
        method: 'DELETE',
      });

      const res = await tenantsRoutes.fetch(req, createMockEnv());
      const rawdata = await res.json();
      const data = rawdata as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to delete connection' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
