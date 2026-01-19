import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager, createCacheManager, CacheKeys, CacheTTL } from '@cache/infrastructure/kv-cache';
import { createMockKV } from '../../../test-utils/setup';

describe('CacheManager', () => {
  let cache: CacheManager;
  let mockKV: KVNamespace;

  beforeEach(() => {
    mockKV = createMockKV();
    cache = new CacheManager(mockKV, 'khhub');
  });

  describe('constructor', () => {
    it('should create a CacheManager with default prefix', () => {
      const defaultCache = new CacheManager(mockKV);
      expect(defaultCache).toBeInstanceOf(CacheManager);
    });

    it('should create a CacheManager with custom prefix', () => {
      const customCache = new CacheManager(mockKV, 'custom');
      expect(customCache).toBeInstanceOf(CacheManager);
    });
  });

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return cached value', async () => {
      const testData = { id: '123', name: 'Test' };
      await cache.set('test-key', testData);

      const result = await cache.get<typeof testData>('test-key');
      expect(result).toEqual(testData);
    });
  });

  describe('set', () => {
    it('should set a value with default TTL', async () => {
      const testData = { id: '123', name: 'Test' };
      await cache.set('test-key', testData);

      const result = await cache.get<typeof testData>('test-key');
      expect(result).toEqual(testData);
    });

    it('should set a value with custom TTL', async () => {
      const testData = { id: '123', name: 'Test' };
      await cache.set('test-key', testData, { ttl: 60 });

      const result = await cache.get<typeof testData>('test-key');
      expect(result).toEqual(testData);
    });

    it('should set a value with expiration timestamp', async () => {
      const testData = { id: '123', name: 'Test' };
      const expiration = Math.floor(Date.now() / 1000) + 3600;
      await cache.set('test-key', testData, { expiration });

      const result = await cache.get<typeof testData>('test-key');
      expect(result).toEqual(testData);
    });
  });

  describe('delete', () => {
    it('should delete a cached value', async () => {
      const testData = { id: '123', name: 'Test' };
      await cache.set('test-key', testData);

      await cache.delete('test-key');

      const result = await cache.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('deleteByPrefix', () => {
    it('should delete all keys with matching prefix', async () => {
      await cache.set('user:1:data', { id: '1' });
      await cache.set('user:2:data', { id: '2' });
      await cache.set('other:data', { id: 'other' });

      const deletedCount = await cache.deleteByPrefix('user:');

      expect(deletedCount).toBe(2);
      expect(await cache.get('user:1:data')).toBeNull();
      expect(await cache.get('user:2:data')).toBeNull();
      expect(await cache.get('other:data')).not.toBeNull();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const testData = { id: '123', name: 'Test' };
      await cache.set('test-key', testData);

      const fetcher = vi.fn().mockResolvedValue({ id: '456', name: 'New' });
      const result = await cache.getOrSet('test-key', fetcher);

      expect(result).toEqual(testData);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should call fetcher and cache result if not cached', async () => {
      const testData = { id: '123', name: 'Test' };
      const fetcher = vi.fn().mockResolvedValue(testData);

      const result = await cache.getOrSet('test-key', fetcher);

      expect(result).toEqual(testData);
      expect(fetcher).toHaveBeenCalledOnce();

      // Verify it was cached
      const cached = await cache.get<typeof testData>('test-key');
      expect(cached).toEqual(testData);
    });
  });

  describe('invalidateTenant', () => {
    it('should delete all tenant-related cache entries', async () => {
      await cache.set('tenant:1:data', { id: '1' });
      await cache.set('tenant:1:users', ['user1', 'user2']);
      await cache.set('tenant:2:data', { id: '2' });

      const deletedCount = await cache.invalidateTenant('1');

      expect(deletedCount).toBe(2);
      expect(await cache.get('tenant:1:data')).toBeNull();
      expect(await cache.get('tenant:1:users')).toBeNull();
      expect(await cache.get('tenant:2:data')).not.toBeNull();
    });
  });

  describe('invalidateUser', () => {
    it('should delete all user-related cache entries', async () => {
      await cache.set('user:1:data', { id: '1' });
      await cache.set('user:1:tenants', ['tenant1', 'tenant2']);
      await cache.set('user:2:data', { id: '2' });

      const deletedCount = await cache.invalidateUser('1');

      expect(deletedCount).toBe(2);
      expect(await cache.get('user:1:data')).toBeNull();
      expect(await cache.get('user:1:tenants')).toBeNull();
      expect(await cache.get('user:2:data')).not.toBeNull();
    });
  });

  describe('purgeAll', () => {
    it('should delete all cache entries', async () => {
      await cache.set('key1', { id: '1' });
      await cache.set('key2', { id: '2' });
      await cache.set('key3', { id: '3' });

      const deletedCount = await cache.purgeAll();

      expect(deletedCount).toBe(3);
      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
      expect(await cache.get('key3')).toBeNull();
    });
  });

  describe('purgeByType', () => {
    it('should purge users cache', async () => {
      await cache.set('users:1', { id: '1' });
      await cache.set('users:2', { id: '2' });
      await cache.set('tenants:1', { id: '1' });

      const deletedCount = await cache.purgeByType('users');

      expect(deletedCount).toBe(2);
      expect(await cache.get('users:1')).toBeNull();
      expect(await cache.get('users:2')).toBeNull();
      expect(await cache.get('tenants:1')).not.toBeNull();
    });

    it('should purge tenants cache', async () => {
      await cache.set('tenants:1', { id: '1' });
      await cache.set('tenants:2', { id: '2' });
      await cache.set('users:1', { id: '1' });

      const deletedCount = await cache.purgeByType('tenants');

      expect(deletedCount).toBe(2);
      expect(await cache.get('tenants:1')).toBeNull();
      expect(await cache.get('tenants:2')).toBeNull();
      expect(await cache.get('users:1')).not.toBeNull();
    });

    it('should purge sessions cache', async () => {
      await cache.set('session:token1', { id: '1' });
      await cache.set('session:token2', { id: '2' });
      await cache.set('users:1', { id: '1' });

      const deletedCount = await cache.purgeByType('sessions');

      expect(deletedCount).toBe(2);
      expect(await cache.get('session:token1')).toBeNull();
      expect(await cache.get('session:token2')).toBeNull();
      expect(await cache.get('users:1')).not.toBeNull();
    });
  });
});

describe('CacheKeys', () => {
  it('should generate user cache key', () => {
    expect(CacheKeys.user('123')).toBe('user:123');
  });

  it('should generate user tenants cache key', () => {
    expect(CacheKeys.userTenants('123')).toBe('user:123:tenants');
  });

  it('should generate user session cache key', () => {
    expect(CacheKeys.userSession('token-hash')).toBe('session:token-hash');
  });

  it('should generate tenant cache key', () => {
    expect(CacheKeys.tenant('123')).toBe('tenant:123');
  });

  it('should generate tenant by slug cache key', () => {
    expect(CacheKeys.tenantBySlug('my-tenant')).toBe('tenant:slug:my-tenant');
  });

  it('should generate tenant connections cache key', () => {
    expect(CacheKeys.tenantConnections('123')).toBe('tenant:123:connections');
  });

  it('should generate tenant users cache key', () => {
    expect(CacheKeys.tenantUsers('123')).toBe('tenant:123:users');
  });

  it('should generate all tenants cache key', () => {
    expect(CacheKeys.allTenants()).toBe('tenants:all');
  });

  it('should generate all users cache key', () => {
    expect(CacheKeys.allUsers()).toBe('users:all');
  });
});

describe('CacheTTL', () => {
  it('should have correct TTL values', () => {
    expect(CacheTTL.SHORT).toBe(60);
    expect(CacheTTL.DEFAULT).toBe(300);
    expect(CacheTTL.MEDIUM).toBe(900);
    expect(CacheTTL.LONG).toBe(3600);
    expect(CacheTTL.VERY_LONG).toBe(86400);
    expect(CacheTTL.SESSION).toBe(604800);
  });
});

describe('createCacheManager', () => {
  it('should create a CacheManager instance', () => {
    const mockKV = createMockKV();
    const cache = createCacheManager(mockKV);

    expect(cache).toBeInstanceOf(CacheManager);
  });

  it('should create a CacheManager with custom prefix', () => {
    const mockKV = createMockKV();
    const cache = createCacheManager(mockKV, 'custom');

    expect(cache).toBeInstanceOf(CacheManager);
  });
});
