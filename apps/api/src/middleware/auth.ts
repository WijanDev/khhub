import { createMiddleware } from 'hono/factory';
import type { Env, Variables } from '../types';
import { getAuth } from '../lib/auth';

/**
 * Auth middleware - validates session and adds user to context
 */
export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const auth = getAuth(c);

    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session) {
      c.set('userId', session.user.id);
      c.set('session', session);
    }

    await next();
  }
);

/**
 * Require authentication middleware
 */
export const requireAuth = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const auth = getAuth(c);

    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('userId', session.user.id);
    c.set('session', session);

    await next();
  }
);

/**
 * Require admin role middleware
 */
export const requireAdmin = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const auth = getAuth(c);

    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (session.user.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    c.set('userId', session.user.id);
    c.set('session', session);

    await next();
  }
);

