import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import type { Env, Variables } from '../types';
import { createDb, users, userTenants } from '../db';
import { createCacheManager, CacheKeys, CacheTTL } from '../lib/cache';

const usersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all users (cached)
usersRoutes.get('/', async (c) => {
  try {
    const cache = createCacheManager(c.env.CACHE);
    const db = createDb(c.env.DB);

    const result = await cache.getOrSet(
      CacheKeys.allUsers(),
      async () =>
        db.query.users.findMany({
          orderBy: (u, { asc }) => [asc(u.name)],
        }),
      { ttl: CacheTTL.MEDIUM }
    );

    return c.json({ users: result });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Get user by ID with their tenants (cached)
usersRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const cache = createCacheManager(c.env.CACHE);
    const db = createDb(c.env.DB);

    const result = await cache.getOrSet(
      CacheKeys.user(id),
      async () => {
        const user = await db.query.users.findFirst({
          where: eq(users.id, id),
          with: {
            userTenants: {
              with: {
                tenant: true,
              },
            },
          },
        });

        if (!user) return null;

        // Transform to match expected format
        return {
          ...user,
          tenants: user.userTenants.map((ut) => ({
            tenant: ut.tenant,
            role: ut.role,
          })),
        };
      },
      { ttl: CacheTTL.DEFAULT }
    );

    if (!result) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: result });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// Update user (invalidates cache)
usersRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const { name, image, role, banned } = await c.req.json<{
      name?: string;
      image?: string;
      role?: 'user' | 'admin';
      banned?: boolean;
    }>();

    const db = createDb(c.env.DB);
    const [user] = await db
      .update(users)
      .set({
        ...(name && { name }),
        ...(image !== undefined && { image }),
        ...(role && { role }),
        ...(banned !== undefined && { banned }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([cache.delete(CacheKeys.user(id)), cache.delete(CacheKeys.allUsers())]);

    return c.json({ message: 'User updated', user });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Delete user (invalidates cache)
usersRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const db = createDb(c.env.DB);
    const [user] = await db.delete(users).where(eq(users.id, id)).returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([cache.invalidateUser(id), cache.delete(CacheKeys.allUsers())]);

    return c.json({ message: 'User deleted', user });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// === User-Tenant Memberships ===

// Add user to tenant (invalidates cache)
usersRoutes.post('/:id/tenants', async (c) => {
  const userId = c.req.param('id');
  try {
    const { tenant_id, role } = await c.req.json<{ tenant_id: string; role?: string }>();

    if (!tenant_id) {
      return c.json({ error: 'tenant_id is required' }, 400);
    }

    const db = createDb(c.env.DB);
    const [membership] = await db
      .insert(userTenants)
      .values({
        userId,
        tenantId: tenant_id,
        role: (role as 'owner' | 'admin' | 'member' | 'viewer') || 'member',
      })
      .returning();

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([
      cache.delete(CacheKeys.user(userId)),
      cache.delete(CacheKeys.tenantUsers(tenant_id)),
    ]);

    return c.json({ message: 'User added to tenant', membership }, 201);
  } catch (error) {
    console.error('Error adding user to tenant:', error);
    return c.json({ error: 'Failed to add user to tenant' }, 500);
  }
});

// Update user role in tenant (invalidates cache)
usersRoutes.put('/:id/tenants/:tenantId', async (c) => {
  const userId = c.req.param('id');
  const tenantId = c.req.param('tenantId');
  try {
    const { role } = await c.req.json<{ role: string }>();

    if (!role) {
      return c.json({ error: 'role is required' }, 400);
    }

    const db = createDb(c.env.DB);
    const [membership] = await db
      .update(userTenants)
      .set({
        role: role as 'owner' | 'admin' | 'member' | 'viewer',
        updatedAt: sql`datetime('now')`,
      })
      .where(sql`${userTenants.userId} = ${userId} AND ${userTenants.tenantId} = ${tenantId}`)
      .returning();

    if (!membership) {
      return c.json({ error: 'Membership not found' }, 404);
    }

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([
      cache.delete(CacheKeys.user(userId)),
      cache.delete(CacheKeys.tenantUsers(tenantId)),
    ]);

    return c.json({ message: 'Role updated', membership });
  } catch (error) {
    console.error('Error updating role:', error);
    return c.json({ error: 'Failed to update role' }, 500);
  }
});

// Remove user from tenant (invalidates cache)
usersRoutes.delete('/:id/tenants/:tenantId', async (c) => {
  const userId = c.req.param('id');
  const tenantId = c.req.param('tenantId');
  try {
    const db = createDb(c.env.DB);
    const [membership] = await db
      .delete(userTenants)
      .where(sql`${userTenants.userId} = ${userId} AND ${userTenants.tenantId} = ${tenantId}`)
      .returning();

    if (!membership) {
      return c.json({ error: 'Membership not found' }, 404);
    }

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([
      cache.delete(CacheKeys.user(userId)),
      cache.delete(CacheKeys.tenantUsers(tenantId)),
    ]);

    return c.json({ message: 'User removed from tenant', membership });
  } catch (error) {
    console.error('Error removing user from tenant:', error);
    return c.json({ error: 'Failed to remove user from tenant' }, 500);
  }
});

export default usersRoutes;
