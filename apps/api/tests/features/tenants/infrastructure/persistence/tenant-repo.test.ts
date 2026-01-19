import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TenantDbManager, createTenantDbManager } from '@tenants/infrastructure/persistence/tenant-repo';
import type { TenantConnection } from '@shared/domain/types';

function createMockD1(): D1Database {
  const mockPrepare = vi.fn();

  return {
    prepare: mockPrepare,
    exec: vi.fn(),
    batch: vi.fn(),
  } as unknown as D1Database;
}

describe('TenantDbManager', () => {
  let mockD1: D1Database;
  let manager: TenantDbManager;

  beforeEach(() => {
    mockD1 = createMockD1();
    manager = new TenantDbManager(mockD1);
  });

  describe('constructor', () => {
    it('should create instance with central database', () => {
      const instance = new TenantDbManager(mockD1);
      expect(instance).toBeInstanceOf(TenantDbManager);
    });
  });

  describe('getConnections', () => {
    it('should return cached connections if available', async () => {
      const cachedConnections: TenantConnection[] = [
        {
          id: 'conn-1',
          tenantId: 'tenant-1',
          name: 'primary',
          dbType: 'd1',
          connectionString: 'd1://tenant-1',
          isPrimary: true,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];
      (manager as any).connections.set('tenant-1', cachedConnections);

      const result = await manager.getConnections('tenant-1');
      expect(result).toEqual(cachedConnections);
      expect(mockD1.prepare).not.toHaveBeenCalled();
    });

    it('should fetch from database when not cached', async () => {
      const dbConnections = [
        {
          id: 'conn-1',
          tenant_id: 'tenant-1',
          name: 'primary',
          db_type: 'd1',
          connection_string: 'd1://tenant-1',
          is_primary: 1,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ] as any;

      const mockBind = vi.fn().mockReturnThis();
      const mockAll = vi.fn().mockResolvedValue({ results: dbConnections });
      (mockD1.prepare as any) = vi.fn(() => ({
        bind: mockBind,
        all: mockAll,
      }));

      const result = await manager.getConnections('tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('conn-1');
      expect(result[0].tenantId).toBe('tenant-1');
      expect(result[0].name).toBe('primary');
      expect(result[0].dbType).toBe('d1');
      expect(result[0].connectionString).toBe('d1://tenant-1');
      expect(result[0].isPrimary).toBe(true);
      expect(result[0].status).toBe('active');
      expect(mockD1.prepare).toHaveBeenCalledWith('SELECT * FROM tenant_connections WHERE tenant_id = ? AND status = ?');
      expect(mockBind).toHaveBeenCalledWith('tenant-1', 'active');
      expect(mockAll).toHaveBeenCalled();
    });

    it('should cache fetched connections', async () => {
      const dbConnections = [
        {
          id: 'conn-1',
          tenant_id: 'tenant-1',
          name: 'primary',
          db_type: 'd1',
          connection_string: 'd1://tenant-1',
          is_primary: 1,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ] as any;

      const mockBind = vi.fn().mockReturnThis();
      const mockAll = vi.fn().mockResolvedValue({ results: dbConnections });
      (mockD1.prepare as any) = vi.fn(() => ({
        bind: mockBind,
        all: mockAll,
      }));

      await manager.getConnections('tenant-1');
      const cached = (manager as any).connections.get('tenant-1');
      expect(cached).toHaveLength(1);
      expect(cached[0].id).toBe('conn-1');
    });

    it('should map is_primary 0 to null', async () => {
      const dbConnections = [
        {
          id: 'conn-1',
          tenant_id: 'tenant-1',
          name: 'secondary',
          db_type: 'd1',
          connection_string: 'd1://tenant-1',
          is_primary: 0,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ] as any;

      const mockBind = vi.fn().mockReturnThis();
      const mockAll = vi.fn().mockResolvedValue({ results: dbConnections });
      (mockD1.prepare as any) = vi.fn(() => ({
        bind: mockBind,
        all: mockAll,
      }));

      const result = await manager.getConnections('tenant-1');
      expect(result[0].isPrimary).toBeNull();
    });

    it('should handle null timestamps', async () => {
      const dbConnections = [
        {
          id: 'conn-1',
          tenant_id: 'tenant-1',
          name: 'primary',
          db_type: 'd1',
          connection_string: 'd1://tenant-1',
          is_primary: 1,
          status: 'active',
          created_at: '',
          updated_at: '',
        },
      ] as any;

      const mockBind = vi.fn().mockReturnThis();
      const mockAll = vi.fn().mockResolvedValue({ results: dbConnections });
      (mockD1.prepare as any) = vi.fn(() => ({
        bind: mockBind,
        all: mockAll,
      }));

      const result = await manager.getConnections('tenant-1');
      expect(result[0].createdAt).toBeNull();
      expect(result[0].updatedAt).toBeNull();
    });
  });

  describe('getPrimaryConnection', () => {
    it('should return primary connection when available', async () => {
      const connections: TenantConnection[] = [
        {
          id: 'conn-1',
          tenantId: 'tenant-1',
          name: 'secondary',
          dbType: 'd1',
          connectionString: 'd1://tenant-1',
          isPrimary: null,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'conn-2',
          tenantId: 'tenant-1',
          name: 'primary',
          dbType: 'd1',
          connectionString: 'd1://tenant-1',
          isPrimary: true,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];
      (manager as any).connections.set('tenant-1', connections);

      const result = await manager.getPrimaryConnection('tenant-1');
      expect(result).toEqual(connections[1]);
    });

    it('should return first connection when no primary', async () => {
      const connections: TenantConnection[] = [
        {
          id: 'conn-1',
          tenantId: 'tenant-1',
          name: 'conn1',
          dbType: 'd1',
          connectionString: 'd1://tenant-1',
          isPrimary: null,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];
      (manager as any).connections.set('tenant-1', connections);

      const result = await manager.getPrimaryConnection('tenant-1');
      expect(result).toEqual(connections[0]);
    });

    it('should return null when no connections', async () => {
      (manager as any).connections.set('tenant-1', []);

      const result = await manager.getPrimaryConnection('tenant-1');
      expect(result).toBeNull();
    });
  });

  describe('getConnectionByName', () => {
    it('should return connection by name', async () => {
      const connections: TenantConnection[] = [
        {
          id: 'conn-1',
          tenantId: 'tenant-1',
          name: 'primary',
          dbType: 'd1',
          connectionString: 'd1://tenant-1',
          isPrimary: true,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'conn-2',
          tenantId: 'tenant-1',
          name: 'secondary',
          dbType: 'd1',
          connectionString: 'd1://tenant-1-secondary',
          isPrimary: null,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];
      (manager as any).connections.set('tenant-1', connections);

      const result = await manager.getConnectionByName('tenant-1', 'secondary');
      expect(result).toEqual(connections[1]);
    });

    it('should return null when connection not found', async () => {
      const connections: TenantConnection[] = [
        {
          id: 'conn-1',
          tenantId: 'tenant-1',
          name: 'primary',
          dbType: 'd1',
          connectionString: 'd1://tenant-1',
          isPrimary: true,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];
      (manager as any).connections.set('tenant-1', connections);

      const result = await manager.getConnectionByName('tenant-1', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createClient', () => {
    it('should create client with primary connection when name not provided', async () => {
      const connection: TenantConnection = {
        id: 'conn-1',
        tenantId: 'tenant-1',
        name: 'primary',
        dbType: 'd1',
        connectionString: 'd1://tenant-1',
        isPrimary: true,
        status: 'active',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      (manager as any).connections.set('tenant-1', [connection]);

      const result = await manager.createClient('tenant-1');
      expect(result).not.toBeNull();
      expect(result?.connection).toEqual(connection);
      expect(result?.connectionString).toBe('d1://tenant-1');
    });

    it('should create client with named connection', async () => {
      const connections: TenantConnection[] = [
        {
          id: 'conn-1',
          tenantId: 'tenant-1',
          name: 'primary',
          dbType: 'd1',
          connectionString: 'd1://tenant-1',
          isPrimary: true,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'conn-2',
          tenantId: 'tenant-1',
          name: 'secondary',
          dbType: 'd1',
          connectionString: 'd1://tenant-1-secondary',
          isPrimary: null,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];
      (manager as any).connections.set('tenant-1', connections);

      const result = await manager.createClient('tenant-1', 'secondary');
      expect(result).not.toBeNull();
      expect(result?.connection).toEqual(connections[1]);
      expect(result?.connectionString).toBe('d1://tenant-1-secondary');
    });

    it('should return null when no connection found', async () => {
      (manager as any).connections.set('tenant-1', []);

      const result = await manager.createClient('tenant-1');
      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific tenant', () => {
      (manager as any).connections.set('tenant-1', []);
      (manager as any).connections.set('tenant-2', []);

      manager.clearCache('tenant-1');
      expect((manager as any).connections.has('tenant-1')).toBe(false);
      expect((manager as any).connections.has('tenant-2')).toBe(true);
    });

    it('should clear all cache when tenant not specified', () => {
      (manager as any).connections.set('tenant-1', []);
      (manager as any).connections.set('tenant-2', []);

      manager.clearCache();
      expect((manager as any).connections.size).toBe(0);
    });
  });
});

describe('createTenantDbManager', () => {
  it('should create TenantDbManager instance', () => {
    const mockD1 = createMockD1();
    const manager = createTenantDbManager(mockD1);
    expect(manager).toBeInstanceOf(TenantDbManager);
  });
});
