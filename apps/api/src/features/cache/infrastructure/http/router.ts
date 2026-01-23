import { Hono } from 'hono';
import type { Env, Variables } from '../../../../shared/domain/types';
import { createCacheManager } from '../kv-cache';

const cacheRoutes = new Hono<{ Bindings: Env; Variables: Variables }>()
    // Cache management endpoints
    .post('/purge', async (c) => {
        try {
            const cache = createCacheManager(c.env.CACHE);
            const deletedCount = await cache.purgeAll();

            return c.json({
                message: 'All cache purged successfully',
                deletedCount
            });
        } catch (error) {
            console.error('Error purging cache:', error);
            return c.json({ error: 'Failed to purge cache' }, 500);
        }
    })
    .post('/purge/:type', async (c) => {
        try {
            const type = c.req.param('type') as 'users' | 'tenants' | 'sessions';

            if (!['users', 'tenants', 'sessions'].includes(type)) {
                return c.json({ error: 'Invalid cache type. Must be: users, tenants, or sessions' }, 400);
            }

            const cache = createCacheManager(c.env.CACHE);
            const deletedCount = await cache.purgeByType(type);

            return c.json({
                message: `${type} cache purged successfully`,
                deletedCount
            });
        } catch (error) {
            console.error(`Error purging ${c.req.param('type')} cache:`, error);
            return c.json({ error: 'Failed to purge cache' }, 500);
        }
    });

export default cacheRoutes;
