import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env, Variables } from './shared/domain/types';
import authRoutes from './features/auth/infrastructure/http/router';
import tenantsRoutes from './features/tenants/infrastructure/http/router';
import usersRoutes from './features/users/infrastructure/http/router';
import storageRoutes from './features/storage/infrastructure/http/router';
import cacheRoutes from './features/cache/infrastructure/http/router';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'https://khhub-web.pages.dev',
      'https://khhub.app',
      'https://www.khhub.app',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    credentials: true,
  })
);

// API routes - chain routes for proper type inference (Hono RPC)
// Routes are mounted directly on app (no /api prefix - using subdomain instead)
const apiRoutes = new Hono<{ Bindings: Env; Variables: Variables }>()
  // Health check
  .get('/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT || 'development',
    });
  })
  // Hello endpoint for testing
  .get('/hello', (c) => {
    return c.json({ message: 'Hello from Hono API!' });
  })
  // Cache management endpoints
  .route('/cache', cacheRoutes)
  // Auth routes (handled by Better Auth)
  .route('/auth', authRoutes)
  // Mount route modules
  .route('/tenants', tenantsRoutes)
  .route('/users', usersRoutes)
  .route('/storage', storageRoutes);

// Mount API routes directly on app (no /api prefix - using subdomain instead)
app.route('/', apiRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Export the API type for RPC client
export type ApiType = typeof apiRoutes;

// Export apiRoutes for type inference and testing
export { apiRoutes };

// Export app as both named and default export
export { app };

// Export for Cloudflare Workers
export default app;
