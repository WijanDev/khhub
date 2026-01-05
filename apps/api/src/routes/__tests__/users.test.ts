import { describe, it, expect, vi, beforeEach } from 'vitest';
import usersRoutes from '../users';
import { createMockEnv } from '../../test/setup';
import type { Env } from '../../types';

const mockGetOrSet = vi.fn();
const mockDelete = vi.fn();
const mockInvalidateUser = vi.fn();
const mockPurgeByType = vi.fn();
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteDb = vi.fn();
const mockReturning = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockValues = vi.fn();
const mockSendEmail = vi.fn();

const mockQuery = {
  users: {
    findMany: mockFindMany,
    findFirst: mockFindFirst,
  },
};

const mockDb = {
  query: mockQuery,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDeleteDb,
};

vi.mock('../../lib/cache', async () => {
  const actual = await vi.importActual('../../lib/cache');
  return {
    ...actual,
    createCacheManager: vi.fn(() => ({
      getOrSet: mockGetOrSet,
      delete: mockDelete,
      invalidateUser: mockInvalidateUser,
      purgeByType: mockPurgeByType,
    })),
  };
});

vi.mock('../../db', async () => {
  const actual = await vi.importActual('../../db');
  return {
    ...actual,
    createDb: vi.fn(() => mockDb),
  };
});

vi.mock('../../lib/email/service', async () => {
  const actual = await vi.importActual('../../lib/email/service');
  return {
    ...actual,
    createEmailServiceFromEnv: vi.fn(() => ({
      sendEmail: mockSendEmail,
    })),
  };
});

vi.mock('../../middleware/validation', async () => {
  const actual = await vi.importActual('../../middleware/validation');
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

describe('usersRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([{ id: 'test-id', name: 'Test User', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date() }]);
    mockGetOrSet.mockImplementation(async (key, fetcher) => {
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
    mockSendEmail.mockResolvedValue(undefined);
  });

  describe('GET /', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@example.com', role: 'user', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'User 2', email: 'user2@example.com', role: 'admin', createdAt: new Date(), updatedAt: new Date() },
      ];
      mockFindMany.mockResolvedValue(mockUsers);

      const req = new Request('https://api.example.com/');
      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { users: Array<{ id: string; name: string; email: string; role: string }> };

      expect(res.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.users[0]).toMatchObject({
        id: '1',
        name: 'User 1',
        email: 'user1@example.com',
        role: 'user',
      });
      expect(mockGetOrSet).toHaveBeenCalled();
      expect(mockFindMany).toHaveBeenCalled();
    });

    it('should handle errors when fetching users', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFindMany.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/');
      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch users' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /:id', () => {
    it('should return user by ID successfully', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        userTenants: [
          {
            tenant: { id: 'tenant-1', name: 'Tenant 1', slug: 'tenant-1' },
            role: 'admin',
          },
        ],
      };
      mockFindFirst.mockResolvedValue(mockUser);

      const req = new Request('https://api.example.com/user-123');
      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { user: { id: string; name: string; email: string; tenants: Array<any> } };

      expect(res.status).toBe(200);
      expect(data.user).toMatchObject({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(data.user.tenants).toHaveLength(1);
      expect(mockGetOrSet).toHaveBeenCalled();
      expect(mockFindFirst).toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      mockFindFirst.mockResolvedValue(null);

      const req = new Request('https://api.example.com/nonexistent');
      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'User not found' });
    });

    it('should handle errors when fetching user', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFindFirst.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/user-123');
      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch user' });
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

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error', 'Validation failed');
    });

    it('should update user successfully', async () => {
      const updatedUser = { id: 'user-123', name: 'Updated User', email: 'test@example.com', role: 'admin', createdAt: new Date(), updatedAt: new Date() };
      mockReturning.mockResolvedValue([updatedUser]);
      mockDelete.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/user-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated User', role: 'admin' }),
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { message: string; user: { id: string; name: string; email: string; role: string } };

      expect(res.status).toBe(200);
      expect(data.message).toBe('User updated');
      expect(data.user).toMatchObject({
        id: 'user-123',
        name: 'Updated User',
        email: 'test@example.com',
        role: 'admin',
      });
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it('should return 404 when user not found', async () => {
      mockReturning.mockResolvedValue([]);

      const req = new Request('https://api.example.com/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated User' }),
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'User not found' });
    });

    it('should handle errors when updating user', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/user-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated User' }),
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update user' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('DELETE /:id', () => {
    it('should delete user successfully and send email', async () => {
      const deletedUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
      mockReturning.mockResolvedValue([deletedUser]);
      mockInvalidateUser.mockResolvedValue(5);
      mockDelete.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/user-123', {
        method: 'DELETE',
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { message: string; user: { id: string; email: string; name: string } };

      expect(res.status).toBe(200);
      expect(data.message).toBe('User deleted');
      expect(data.user).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(mockDeleteDb).toHaveBeenCalled();
      expect(mockInvalidateUser).toHaveBeenCalledWith('user-123');
      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('should delete user successfully even if email fails', async () => {
      const deletedUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
      mockReturning.mockResolvedValue([deletedUser]);
      mockInvalidateUser.mockResolvedValue(5);
      mockDelete.mockResolvedValue(undefined);
      mockSendEmail.mockRejectedValue(new Error('Email service error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const req = new Request('https://api.example.com/user-123', {
        method: 'DELETE',
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { message: string; user: { id: string; email: string; name: string } };

      expect(res.status).toBe(200);
      expect(data.message).toBe('User deleted');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send deletion email:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should return 404 when user not found', async () => {
      mockReturning.mockResolvedValue([]);

      const req = new Request('https://api.example.com/nonexistent', {
        method: 'DELETE',
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'User not found' });
    });

    it('should handle errors when deleting user', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/user-123', {
        method: 'DELETE',
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to delete user' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('POST /:id/tenants', () => {
    it('should return 400 when validation fails', async () => {
      const req = new Request('https://api.example.com/user-123/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: '' }),
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error', 'Validation failed');
    });

    it('should add user to tenant successfully', async () => {
      const newMembership = {
        id: 'membership-1',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([newMembership]);
      mockDelete.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/user-123/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'tenant-123',
          role: 'member',
        }),
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { message: string; membership: { id: string; userId: string; tenantId: string; role: string } };

      expect(res.status).toBe(201);
      expect(data.message).toBe('User added to tenant');
      expect(data.membership).toMatchObject({
        id: 'membership-1',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'member',
      });
      expect(mockInsert).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it('should handle errors when adding user to tenant', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/user-123/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'tenant-123',
          role: 'member',
        }),
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to add user to tenant' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('PUT /:id/tenants/:tenantId', () => {
    it('should return 400 when validation fails', async () => {
      const req = new Request('https://api.example.com/invalid-id/tenants/invalid-tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: '' }),
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(400);
      expect(data).toHaveProperty('error', 'Validation failed');
    });

    it('should update user role in tenant successfully', async () => {
      const updatedMembership = {
        id: 'membership-1',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([updatedMembership]);
      mockDelete.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/user-123/tenants/tenant-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { message: string; membership: { id: string; userId: string; tenantId: string; role: string } };

      expect(res.status).toBe(200);
      expect(data.message).toBe('Role updated');
      expect(data.membership).toMatchObject({
        id: 'membership-1',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'admin',
      });
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it('should return 404 when membership not found', async () => {
      mockReturning.mockResolvedValue([]);

      const req = new Request('https://api.example.com/user-123/tenants/tenant-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'Membership not found' });
    });

    it('should handle errors when updating role', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/user-123/tenants/tenant-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to update role' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('DELETE /:id/tenants/:tenantId', () => {
    it('should remove user from tenant successfully', async () => {
      const deletedMembership = {
        id: 'membership-1',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([deletedMembership]);
      mockDelete.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/user-123/tenants/tenant-123', {
        method: 'DELETE',
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { message: string; membership: { id: string; userId: string; tenantId: string; role: string } };

      expect(res.status).toBe(200);
      expect(data.message).toBe('User removed from tenant');
      expect(data.membership).toMatchObject({
        id: 'membership-1',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'member',
      });
      expect(mockDeleteDb).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });

    it('should return 404 when membership not found', async () => {
      mockReturning.mockResolvedValue([]);

      const req = new Request('https://api.example.com/user-123/tenants/nonexistent', {
        method: 'DELETE',
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'Membership not found' });
    });

    it('should handle errors when removing user from tenant', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockReturning.mockRejectedValue(new Error('Database error'));

      const req = new Request('https://api.example.com/user-123/tenants/tenant-123', {
        method: 'DELETE',
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to remove user from tenant' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('POST /cache/purge', () => {
    it('should purge users cache successfully', async () => {
      mockPurgeByType.mockResolvedValue(10);

      const req = new Request('https://api.example.com/cache/purge', {
        method: 'POST',
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { message: string; deletedCount: number };

      expect(res.status).toBe(200);
      expect(data.message).toBe('Users cache purged successfully');
      expect(data.deletedCount).toBe(10);
      expect(mockPurgeByType).toHaveBeenCalledWith('users');
    });

    it('should handle errors when purging cache', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockPurgeByType.mockRejectedValue(new Error('Cache error'));

      const req = new Request('https://api.example.com/cache/purge', {
        method: 'POST',
      });

      const res = await usersRoutes.fetch(req, createMockEnv());
      const data = (await res.json()) as { error: string };

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to purge users cache' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
