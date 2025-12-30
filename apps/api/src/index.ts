import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env, Variables } from './types';
import tenantsRoutes from './routes/tenants';
import usersRoutes from './routes/users';
import storageRoutes from './routes/storage';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173', 'https://khhub-web.pages.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  })
);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// API routes
const api = new Hono<{ Bindings: Env; Variables: Variables }>();

// Hello endpoint for testing
api.get('/hello', (c) => {
  return c.json({ message: 'Hello from Hono API!' });
});

// Mount route modules
api.route('/tenants', tenantsRoutes);
api.route('/users', usersRoutes);
api.route('/storage', storageRoutes);

// Mount API under /api prefix
app.route('/api', api);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Export for Cloudflare Workers
export default app;
