import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import type { Env, Variables } from '@shared/domain/types';
import { createDb, tenants, tenantConnections } from '@shared/infrastructure/db';
import { createCacheManager, CacheKeys, CacheTTL } from '@cache/infrastructure/kv-cache';
import { validateJson, IdParamSchema, IdConnectionParamSchema, validateParam } from '@shared/infrastructure/http/middleware/validation';
import { CreateTenantSchema, UpdateTenantSchema, CreateConnectionSchema, UpdateConnectionSchema } from '@khhub/shared';

// Chain routes for proper type inference (Hono RPC)
const tenantsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>()
  // Get all tenants (cached)
  .get('/', async (c) => {
    try {
      const cache = createCacheManager(c.env.CACHE);
      const db = createDb(c.env.DB);

      const result = await cache.getOrSet(
        CacheKeys.allTenants(),
        async () => db.query.tenants.findMany({ orderBy: (t, { asc }) => [asc(t.name)] }),
        { ttl: CacheTTL.MEDIUM }
      );

      return c.json({ tenants: result });
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return c.json({ error: 'Failed to fetch tenants' }, 500);
    }
  })
  // Get tenant by ID with connections (cached)
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const cache = createCacheManager(c.env.CACHE);
      const db = createDb(c.env.DB);

      const result = await cache.getOrSet(
        CacheKeys.tenant(id),
        async () => {
          const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, id),
            with: {
              connections: {
                orderBy: (conn, { desc, asc }) => [desc(conn.isPrimary), asc(conn.name)],
              },
            },
          });
          return tenant;
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
  })
  // Create tenant (invalidates cache)
  .post('/', validateJson(CreateTenantSchema), async (c) => {
    try {
      const { name, slug } = c.req.valid('json');

      const db = createDb(c.env.DB);
      const [tenant] = await db.insert(tenants).values({ name, slug }).returning();

      // Invalidate tenants list cache
      const cache = createCacheManager(c.env.CACHE);
      await cache.delete(CacheKeys.allTenants());

      return c.json({ message: 'Tenant created', tenant }, 201);
    } catch (error) {
      console.error('Error creating tenant:', error);
      return c.json({ error: 'Failed to create tenant' }, 500);
    }
  })
  // Update tenant (invalidates cache)
  .put('/:id', validateParam(IdParamSchema), validateJson(UpdateTenantSchema), async (c) => {
    const { id } = c.req.valid('param');
    try {
      const { name, status } = c.req.valid('json');

      const db = createDb(c.env.DB);
      const updateData: any = {
        updatedAt: sql`datetime('now')`,
      };
      if (name) updateData.name = name;
      if (status) updateData.status = status;

      const [tenant] = await db
        .update(tenants)
        .set(updateData)
        .where(eq(tenants.id, id))
        .returning();

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
  })
  // Delete tenant (invalidates cache)
  .delete('/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const db = createDb(c.env.DB);
      const [tenant] = await db.delete(tenants).where(eq(tenants.id, id)).returning();

      if (!tenant) {
        return c.json({ error: 'Tenant not found' }, 404);
      }

      // Invalidate caches
      const cache = createCacheManager(c.env.CACHE);
      await Promise.all([cache.invalidateTenant(id), cache.delete(CacheKeys.allTenants())]);

      return c.json({ message: 'Tenant deleted', tenant });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      return c.json({ error: 'Failed to delete tenant' }, 500);
    }
  })
  // === Tenant Connections ===
  // Get connections for a tenant (cached)
  .get('/:id/connections', async (c) => {
    const tenantId = c.req.param('id');
    try {
      const cache = createCacheManager(c.env.CACHE);
      const db = createDb(c.env.DB);

      const connections = await cache.getOrSet(
        CacheKeys.tenantConnections(tenantId),
        async () =>
          db.query.tenantConnections.findMany({
            where: eq(tenantConnections.tenantId, tenantId),
            orderBy: (conn, { desc, asc }) => [desc(conn.isPrimary), asc(conn.name)],
          }),
        { ttl: CacheTTL.LONG }
      );

      return c.json({ connections });
    } catch (error) {
      console.error('Error fetching connections:', error);
      return c.json({ error: 'Failed to fetch connections' }, 500);
    }
  })
  // Add connection to tenant (invalidates cache)
  .post('/:id/connections', validateParam(IdParamSchema), validateJson(CreateConnectionSchema), async (c) => {
    const { id: tenantId } = c.req.valid('param');
    try {
      const { name, db_type, connection_string, is_primary } = c.req.valid('json');

      const db = createDb(c.env.DB);

      // If setting as primary, unset other primaries first
      if (is_primary) {
        await db
          .update(tenantConnections)
          .set({ isPrimary: false })
          .where(eq(tenantConnections.tenantId, tenantId));
      }

      const [connection] = await db
        .insert(tenantConnections)
        .values({
          tenantId,
          name,
          dbType: db_type,
          connectionString: connection_string,
          isPrimary: is_primary || false,
        })
        .returning();

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
  })
  // Update connection (invalidates cache)
  .put('/:id/connections/:connectionId', validateParam(IdConnectionParamSchema), validateJson(UpdateConnectionSchema), async (c) => {
    const { id: tenantId, connectionId } = c.req.valid('param');
    try {
      const { name, connection_string, is_primary, status } = c.req.valid('json');

      const db = createDb(c.env.DB);

      // If setting as primary, unset other primaries first
      if (is_primary) {
        await db
          .update(tenantConnections)
          .set({ isPrimary: false })
          .where(eq(tenantConnections.tenantId, tenantId));
      }

      const [connection] = await db
        .update(tenantConnections)
        .set({
          ...(name && { name }),
          ...(connection_string && { connectionString: connection_string }),
          ...(is_primary !== undefined && { isPrimary: is_primary }),
          ...(status && { status }),
          updatedAt: sql`datetime('now')`,
        })
        .where(eq(tenantConnections.id, connectionId))
        .returning();

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
  })
  // Delete connection (invalidates cache)
  .delete('/:id/connections/:connectionId', async (c) => {
    const connectionId = c.req.param('connectionId');
    const tenantId = c.req.param('id');
    try {
      const db = createDb(c.env.DB);
      const [connection] = await db
        .delete(tenantConnections)
        .where(eq(tenantConnections.id, connectionId))
        .returning();

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

export default tenantsRoutes;
