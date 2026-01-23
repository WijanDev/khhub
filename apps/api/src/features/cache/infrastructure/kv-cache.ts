/**
 * Cache utility for Cloudflare KV
 * Provides typed caching with automatic serialization/deserialization
 */

export interface CacheOptions {
    /** TTL in seconds (default: 300 = 5 minutes) */
    ttl?: number;
    /** Expiration time as Unix timestamp */
    expiration?: number;
}

export class CacheManager {
    private readonly kv: KVNamespace;
    private readonly prefix: string;

    constructor(kv: KVNamespace, prefix: string = 'khhub') {
        this.kv = kv;
        this.prefix = prefix;
    }

    /**
     * Build cache key with prefix
     */
    private key(key: string): string {
        return `${this.prefix}:${key}`;
    }

    /**
     * Get cached value
     */
    async get<T>(key: string): Promise<T | null> {
        const value = await this.kv.get(this.key(key), 'json');
        return value as T | null;
    }

    /**
     * Set cached value
     */
    async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
        const { ttl = 300, expiration } = options;
        await this.kv.put(this.key(key), JSON.stringify(value), {
            expirationTtl: expiration ? undefined : ttl,
            expiration,
        });
    }

    /**
     * Delete cached value
     */
    async delete(key: string): Promise<void> {
        await this.kv.delete(this.key(key));
    }

    /**
     * Delete multiple keys by pattern (prefix match)
     */
    async deleteByPrefix(keyPrefix: string): Promise<number> {
        const fullPrefix = this.key(keyPrefix);
        const list = await this.kv.list({ prefix: fullPrefix });

        await Promise.all(list.keys.map((k) => this.kv.delete(k.name)));
        return list.keys.length;
    }

    /**
     * Get or set cached value (cache-aside pattern)
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const value = await fetcher();
        await this.set(key, value, options);
        return value;
    }

    /**
     * Invalidate cache for a tenant
     */
    async invalidateTenant(tenantId: string): Promise<number> {
        return this.deleteByPrefix(`tenant:${tenantId}`);
    }

    /**
     * Invalidate cache for a user
     */
    async invalidateUser(userId: string): Promise<number> {
        return this.deleteByPrefix(`user:${userId}`);
    }

    /**
     * Purge all cache entries
     */
    async purgeAll(): Promise<number> {
        const list = await this.kv.list({ prefix: `${this.prefix}:` });

        await Promise.all(list.keys.map((k) => this.kv.delete(k.name)));
        return list.keys.length;
    }

    /**
     * Purge cache by type (users, tenants, etc.)
     */
    async purgeByType(type: 'users' | 'tenants' | 'sessions'): Promise<number> {
        const prefixMap = {
            users: 'users:',
            tenants: 'tenants:',
            sessions: 'session:',
        };
        return this.deleteByPrefix(prefixMap[type]);
    }
}

/**
 * Pre-defined cache key builders
 */
export const CacheKeys = {
    // User cache keys
    user: (userId: string) => `user:${userId}`,
    userTenants: (userId: string) => `user:${userId}:tenants`,
    userSession: (tokenHash: string) => `session:${tokenHash}`,

    // Tenant cache keys
    tenant: (tenantId: string) => `tenant:${tenantId}`,
    tenantBySlug: (slug: string) => `tenant:slug:${slug}`,
    tenantConnections: (tenantId: string) => `tenant:${tenantId}:connections`,
    tenantUsers: (tenantId: string) => `tenant:${tenantId}:users`,

    // List cache keys
    allTenants: () => 'tenants:all',
    allUsers: () => 'users:all',
};

/**
 * Cache TTL presets (in seconds)
 */
export const CacheTTL = {
    SHORT: 60,           // 1 minute
    DEFAULT: 300,        // 5 minutes
    MEDIUM: 900,         // 15 minutes
    LONG: 3600,          // 1 hour
    VERY_LONG: 86400,    // 24 hours
    SESSION: 604800,     // 7 days
};

/**
 * Factory function to create CacheManager
 */
export function createCacheManager(kv: KVNamespace, prefix?: string): CacheManager {
    return new CacheManager(kv, prefix);
}
