import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import type { Env, Variables } from '@shared/domain/types';
import { createDb, Database, users, userTenants } from '@shared/infrastructure/db';
import { createCacheManager, CacheKeys, CacheTTL, CacheManager } from '@cache/infrastructure/kv-cache';
import { validateJson, validateParam, IdParamSchema, IdTenantParamSchema } from '@shared/infrastructure/http/middleware/validation';
import { AddUserToTenantSchema, UpdateUserRoleSchema } from '@khhub/shared';
import { z } from 'zod';
import { createEmailServiceFromEnv } from '@email/service';
import { EmailTemplates } from '@email/application/templates';

// User update schema (specific to this API)
const UpdateUserApiSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  image: z.url().optional(),
  role: z.enum(['user', 'admin']).optional(),
  banned: z.boolean().optional(),
});

// Chain routes for proper type inference (Hono RPC)
const usersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>()
  // Get all users (cached)
  .get('/', async (c) => {
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
  })
  // Get user by ID with their tenants (cached)
  .get('/:id', async (c) => {
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
  })
  // Update user (invalidates cache)
  .put('/:id', validateParam(IdParamSchema), validateJson(UpdateUserApiSchema), async (c) => {
    const { id: userId } = c.req.valid('param');
    try {
      const { name, image, role, banned } = c.req.valid('json');

      const db = createDb(c.env.DB);
      const updateData: any = {
        updatedAt: new Date(),
      };
      if (name) updateData.name = name;
      if (image !== undefined) updateData.image = image;
      if (role) updateData.role = role;
      if (banned !== undefined) updateData.banned = banned;

      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      // Invalidate caches
      const cache = createCacheManager(c.env.CACHE);
      await invalidateCaches(cache, true, userId);

      return c.json({ message: 'User updated', user });
    } catch (error) {
      console.error('Error updating user:', error);
      return c.json({ error: 'Failed to update user' }, 500);
    }
  })
  // Delete user (invalidates cache and sends email)
  .delete('/:id', async (c) => {
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

      // Send email notification if email service is configured
      try {
        const emailService = createEmailServiceFromEnv(c.env);
        await emailService.sendEmail({
          to: user.email,
          subject: 'Your KH Hub account has been deleted',
          html: EmailTemplates.accountDeleted(user.name),
        });
      } catch (emailError) {
        // Log email error but don't fail the deletion
        console.error('Failed to send deletion email:', emailError);
      }

      return c.json({ message: 'User deleted', user });
    } catch (error) {
      console.error('Error deleting user:', error);
      return c.json({ error: 'Failed to delete user' }, 500);
    }
  })
  // === User-Tenant Memberships ===
  // Add user to tenant (invalidates cache)
  .post('/:id/tenants', validateParam(IdParamSchema), validateJson(AddUserToTenantSchema), async (c) => {
    const { id: userId } = c.req.valid('param');
    try {
      const { tenant_id, role } = c.req.valid('json');

      const db = createDb(c.env.DB);

      const [membership] = await db
        .insert(userTenants)
        .values({
          userId,
          tenantId: tenant_id,
          role: role,
        })
        .returning();

      // Invalidate caches
      const cache = createCacheManager(c.env.CACHE);
      await invalidateCaches(cache, false, userId, tenant_id);

      return c.json({ message: 'User added to tenant', membership }, 201);
    } catch (error) {
      console.error('Error adding user to tenant:', error);
      return c.json({ error: 'Failed to add user to tenant' }, 500);
    }
  })
  // Update user role in tenant (invalidates cache)
  .put('/:id/tenants/:tenantId', validateParam(IdTenantParamSchema), validateJson(UpdateUserRoleSchema), async (c) => {
    const { id: userId, tenantId } = c.req.valid('param');
    try {
      const { role } = c.req.valid('json');

      const db = createDb(c.env.DB);
      const membership = await getMembership(userId, tenantId, role, db);

      if (!membership) {
        return c.json({ error: 'Membership not found' }, 404);
      }

      // Invalidate caches
      const cache = createCacheManager(c.env.CACHE);
      await invalidateCaches(cache, false, userId, tenantId);

      return c.json({ message: 'Role updated', membership });
    } catch (error) {
      console.error('Error updating role:', error);
      return c.json({ error: 'Failed to update role' }, 500);
    }
  })
  // Remove user from tenant (invalidates cache)
  .delete('/:id/tenants/:tenantId', async (c) => {
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
      await invalidateCaches(cache, false, userId, tenantId);

      return c.json({ message: 'User removed from tenant', membership });
    } catch (error) {
      console.error('Error removing user from tenant:', error);
      return c.json({ error: 'Failed to remove user from tenant' }, 500);
    }
  })
  // Purge users cache
  .post('/cache/purge', async (c) => {
    try {
      const cache = createCacheManager(c.env.CACHE);
      const deletedCount = await cache.purgeByType('users');

      return c.json({
        message: 'Users cache purged successfully',
        deletedCount
      });
    } catch (error) {
      console.error('Error purging users cache:', error);
      return c.json({ error: 'Failed to purge users cache' }, 500);
    }
  });

const getMembership = async (userId: string, tenantId: string, role: "admin" | "owner" | "member" | "viewer", db: Database) => {
  const [membership] = await db
    .update(userTenants)
    .set({
      role: role,
      updatedAt: sql`datetime('now')`,
    })
    .where(sql`${userTenants.userId} = ${userId} AND ${userTenants.tenantId} = ${tenantId}`)
    .returning();

  return membership;
}

const invalidateCaches = async (cacheManager: CacheManager, allUsers: boolean, userId?: string, tenantId?: string,) => {
  const deleteUserCache = userId ? cacheManager.delete(CacheKeys.user(userId)) : Promise.resolve();
  const deleteTenantCache = tenantId ? cacheManager.delete(CacheKeys.tenantUsers(tenantId)) : Promise.resolve();
  const deleteAllUsersCache = allUsers ? cacheManager.delete(CacheKeys.allUsers()) : Promise.resolve();
  await Promise.all([
    deleteUserCache,
    deleteTenantCache,
    deleteAllUsersCache,
  ]);
}

export default usersRoutes;
