import { Hono } from 'hono';
import type { Env, Tenant, TenantConnection, TenantWithConnections, Variables } from '../types';
import { createCacheManager, CacheKeys, CacheTTL } from '../lib/cache';

const tenants = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all tenants (cached)
tenants.get('/', async (c) => {
  try {
    const cache = createCacheManager(c.env.CACHE);

    const result = await cache.getOrSet(
      CacheKeys.allTenants(),
      async () => {
        const { results } = await c.env.DB.prepare('SELECT * FROM tenants ORDER BY name').all<Tenant>();
        return results;
      },
      { ttl: CacheTTL.MEDIUM }
    );

    return c.json({ tenants: result });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return c.json({ error: 'Failed to fetch tenants' }, 500);
  }
});

// Get tenant by ID with connections (cached)
tenants.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const cache = createCacheManager(c.env.CACHE);

    const result = await cache.getOrSet<TenantWithConnections | null>(
      CacheKeys.tenant(id),
      async () => {
        const tenant = await c.env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(id).first<Tenant>();

        if (!tenant) {
          return null;
        }

        const { results: connections } = await c.env.DB.prepare(
          'SELECT * FROM tenant_connections WHERE tenant_id = ? ORDER BY is_primary DESC, name'
        )
          .bind(id)
          .all<TenantConnection>();

        return { ...tenant, connections };
      },
      { ttl: CacheTTL.DEFAULT }
    );

    if (!result) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    return c.json({ tenant: result });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return c.json({ error: 'Failed to fetch tenant' }, 500);
  }
});

// Create tenant (invalidates cache)
tenants.post('/', async (c) => {
  try {
    const { name, slug } = await c.req.json<{ name: string; slug: string }>();

    if (!name || !slug) {
      return c.json({ error: 'Name and slug are required' }, 400);
    }

    const tenant = await c.env.DB.prepare('INSERT INTO tenants (name, slug) VALUES (?, ?) RETURNING *')
      .bind(name, slug)
      .first<Tenant>();

    // Invalidate tenants list cache
    const cache = createCacheManager(c.env.CACHE);
    await cache.delete(CacheKeys.allTenants());

    return c.json({ message: 'Tenant created', tenant }, 201);
  } catch (error) {
    console.error('Error creating tenant:', error);
    return c.json({ error: 'Failed to create tenant' }, 500);
  }
});

// Update tenant (invalidates cache)
tenants.put('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const { name, status } = await c.req.json<{ name?: string; status?: string }>();

    const tenant = await c.env.DB.prepare(
      "UPDATE tenants SET name = COALESCE(?, name), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ? RETURNING *"
    )
      .bind(name, status, id)
      .first<Tenant>();

    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([
      cache.delete(CacheKeys.tenant(id)),
      cache.delete(CacheKeys.tenantBySlug(tenant.slug)),
      cache.delete(CacheKeys.allTenants()),
    ]);

    return c.json({ message: 'Tenant updated', tenant });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return c.json({ error: 'Failed to update tenant' }, 500);
  }
});

// Delete tenant (invalidates cache)
tenants.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const tenant = await c.env.DB.prepare('DELETE FROM tenants WHERE id = ? RETURNING *')
      .bind(id)
      .first<Tenant>();

    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([
      cache.invalidateTenant(id),
      cache.delete(CacheKeys.allTenants()),
    ]);

    return c.json({ message: 'Tenant deleted', tenant });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return c.json({ error: 'Failed to delete tenant' }, 500);
  }
});

// === Tenant Connections ===

// Get connections for a tenant (cached)
tenants.get('/:id/connections', async (c) => {
  const tenantId = c.req.param('id');
  try {
    const cache = createCacheManager(c.env.CACHE);

    const connections = await cache.getOrSet(
      CacheKeys.tenantConnections(tenantId),
      async () => {
        const { results } = await c.env.DB.prepare(
          'SELECT * FROM tenant_connections WHERE tenant_id = ? ORDER BY is_primary DESC, name'
        )
          .bind(tenantId)
          .all<TenantConnection>();
        return results;
      },
      { ttl: CacheTTL.LONG }
    );

    return c.json({ connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return c.json({ error: 'Failed to fetch connections' }, 500);
  }
});

// Add connection to tenant (invalidates cache)
tenants.post('/:id/connections', async (c) => {
  const tenantId = c.req.param('id');
  try {
    const { name, db_type, connection_string, is_primary } = await c.req.json<{
      name: string;
      db_type: string;
      connection_string: string;
      is_primary?: boolean;
    }>();

    if (!name || !db_type || !connection_string) {
      return c.json({ error: 'Name, db_type, and connection_string are required' }, 400);
    }

    // If setting as primary, unset other primaries first
    if (is_primary) {
      await c.env.DB.prepare('UPDATE tenant_connections SET is_primary = 0 WHERE tenant_id = ?')
        .bind(tenantId)
        .run();
    }

    const connection = await c.env.DB.prepare(
      'INSERT INTO tenant_connections (tenant_id, name, db_type, connection_string, is_primary) VALUES (?, ?, ?, ?, ?) RETURNING *'
    )
      .bind(tenantId, name, db_type, connection_string, is_primary ? 1 : 0)
      .first<TenantConnection>();

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([
      cache.delete(CacheKeys.tenantConnections(tenantId)),
      cache.delete(CacheKeys.tenant(tenantId)),
    ]);

    return c.json({ message: 'Connection added', connection }, 201);
  } catch (error) {
    console.error('Error adding connection:', error);
    return c.json({ error: 'Failed to add connection' }, 500);
  }
});

// Update connection (invalidates cache)
tenants.put('/:id/connections/:connectionId', async (c) => {
  const connectionId = c.req.param('connectionId');
  const tenantId = c.req.param('id');
  try {
    const { name, connection_string, is_primary, status } = await c.req.json<{
      name?: string;
      connection_string?: string;
      is_primary?: boolean;
      status?: string;
    }>();

    // If setting as primary, unset other primaries first
    if (is_primary) {
      await c.env.DB.prepare('UPDATE tenant_connections SET is_primary = 0 WHERE tenant_id = ?')
        .bind(tenantId)
        .run();
    }

    const connection = await c.env.DB.prepare(
      `UPDATE tenant_connections 
       SET name = COALESCE(?, name), 
           connection_string = COALESCE(?, connection_string),
           is_primary = COALESCE(?, is_primary),
           status = COALESCE(?, status),
           updated_at = datetime('now') 
       WHERE id = ? AND tenant_id = ? 
       RETURNING *`
    )
      .bind(name, connection_string, is_primary ? 1 : null, status, connectionId, tenantId)
      .first<TenantConnection>();

    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([
      cache.delete(CacheKeys.tenantConnections(tenantId)),
      cache.delete(CacheKeys.tenant(tenantId)),
    ]);

    return c.json({ message: 'Connection updated', connection });
  } catch (error) {
    console.error('Error updating connection:', error);
    return c.json({ error: 'Failed to update connection' }, 500);
  }
});

// Delete connection (invalidates cache)
tenants.delete('/:id/connections/:connectionId', async (c) => {
  const connectionId = c.req.param('connectionId');
  const tenantId = c.req.param('id');
  try {
    const connection = await c.env.DB.prepare(
      'DELETE FROM tenant_connections WHERE id = ? AND tenant_id = ? RETURNING *'
    )
      .bind(connectionId, tenantId)
      .first<TenantConnection>();

    if (!connection) {
      return c.json({ error: 'Connection not found' }, 404);
    }

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([
      cache.delete(CacheKeys.tenantConnections(tenantId)),
      cache.delete(CacheKeys.tenant(tenantId)),
    ]);

    return c.json({ message: 'Connection deleted', connection });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return c.json({ error: 'Failed to delete connection' }, 500);
  }
});

export default tenants;
