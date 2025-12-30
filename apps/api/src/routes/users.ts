import { Hono } from 'hono';
import type { Env, User, UserTenant, Tenant, UserWithTenants, Variables } from '../types';
import { createCacheManager, CacheKeys, CacheTTL } from '../lib/cache';

const users = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all users (cached)
users.get('/', async (c) => {
  try {
    const cache = createCacheManager(c.env.CACHE);

    const result = await cache.getOrSet(
      CacheKeys.allUsers(),
      async () => {
        const { results } = await c.env.DB.prepare(
          'SELECT id, email, name, avatar_url, email_verified, status, created_at, updated_at FROM users ORDER BY name'
        ).all<Omit<User, 'password_hash'>>();
        return results;
      },
      { ttl: CacheTTL.MEDIUM }
    );

    return c.json({ users: result });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Get user by ID with their tenants (cached)
users.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const cache = createCacheManager(c.env.CACHE);

    const result = await cache.getOrSet<UserWithTenants | null>(
      CacheKeys.user(id),
      async () => {
        const user = await c.env.DB.prepare(
          'SELECT id, email, name, avatar_url, email_verified, status, created_at, updated_at FROM users WHERE id = ?'
        )
          .bind(id)
          .first<Omit<User, 'password_hash'>>();

        if (!user) {
          return null;
        }

        // Get user's tenants
        const { results: memberships } = await c.env.DB.prepare(
          `SELECT ut.role, t.* FROM user_tenants ut 
           JOIN tenants t ON ut.tenant_id = t.id 
           WHERE ut.user_id = ?`
        )
          .bind(id)
          .all<UserTenant & Tenant>();

        return {
          ...user,
          tenants: memberships.map((m) => ({
            tenant: {
              id: m.id,
              name: m.name,
              slug: m.slug,
              status: m.status,
              created_at: m.created_at,
              updated_at: m.updated_at,
            },
            role: m.role,
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

// Create user (invalidates cache)
users.post('/', async (c) => {
  try {
    const { email, password, name } = await c.req.json<{
      email: string;
      password: string;
      name: string;
    }>();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // In production, hash the password properly
    // This is a placeholder - use bcrypt or similar
    const password_hash = `hashed_${password}`;

    const user = await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?) RETURNING id, email, name, status, created_at'
    )
      .bind(email, password_hash, name)
      .first();

    // Invalidate users list cache
    const cache = createCacheManager(c.env.CACHE);
    await cache.delete(CacheKeys.allUsers());

    return c.json({ message: 'User created', user }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Update user (invalidates cache)
users.put('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const { name, avatar_url, status } = await c.req.json<{
      name?: string;
      avatar_url?: string;
      status?: string;
    }>();

    const user = await c.env.DB.prepare(
      `UPDATE users SET 
       name = COALESCE(?, name), 
       avatar_url = COALESCE(?, avatar_url),
       status = COALESCE(?, status),
       updated_at = datetime('now') 
       WHERE id = ? 
       RETURNING id, email, name, avatar_url, status, updated_at`
    )
      .bind(name, avatar_url, status, id)
      .first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([
      cache.delete(CacheKeys.user(id)),
      cache.delete(CacheKeys.allUsers()),
    ]);

    return c.json({ message: 'User updated', user });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Delete user (invalidates cache)
users.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const user = await c.env.DB.prepare('DELETE FROM users WHERE id = ? RETURNING id, email, name')
      .bind(id)
      .first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Invalidate caches
    const cache = createCacheManager(c.env.CACHE);
    await Promise.all([
      cache.invalidateUser(id),
      cache.delete(CacheKeys.allUsers()),
    ]);

    return c.json({ message: 'User deleted', user });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// === User-Tenant Memberships ===

// Add user to tenant (invalidates cache)
users.post('/:id/tenants', async (c) => {
  const userId = c.req.param('id');
  try {
    const { tenant_id, role } = await c.req.json<{ tenant_id: string; role?: string }>();

    if (!tenant_id) {
      return c.json({ error: 'tenant_id is required' }, 400);
    }

    const membership = await c.env.DB.prepare(
      'INSERT INTO user_tenants (user_id, tenant_id, role) VALUES (?, ?, ?) RETURNING *'
    )
      .bind(userId, tenant_id, role || 'member')
      .first<UserTenant>();

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
users.put('/:id/tenants/:tenantId', async (c) => {
  const userId = c.req.param('id');
  const tenantId = c.req.param('tenantId');
  try {
    const { role } = await c.req.json<{ role: string }>();

    if (!role) {
      return c.json({ error: 'role is required' }, 400);
    }

    const membership = await c.env.DB.prepare(
      "UPDATE user_tenants SET role = ?, updated_at = datetime('now') WHERE user_id = ? AND tenant_id = ? RETURNING *"
    )
      .bind(role, userId, tenantId)
      .first<UserTenant>();

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
users.delete('/:id/tenants/:tenantId', async (c) => {
  const userId = c.req.param('id');
  const tenantId = c.req.param('tenantId');
  try {
    const membership = await c.env.DB.prepare(
      'DELETE FROM user_tenants WHERE user_id = ? AND tenant_id = ? RETURNING *'
    )
      .bind(userId, tenantId)
      .first<UserTenant>();

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

export default users;
