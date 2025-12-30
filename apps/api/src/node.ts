/**
 * Node.js development server
 * For local development without Cloudflare Workers
 *
 * Note: For full D1 support during local development, use:
 * npm run dev:cf (runs wrangler dev with local D1 emulation)
 */
import { serve } from '@hono/node-server';
import app from './index';

const port = Number(process.env.PORT) || 3000;

console.log(`
🔥 KH Hub API - Development Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server:   http://localhost:${port}
Health:   http://localhost:${port}/health
API:      http://localhost:${port}/api

⚠️  Note: This server runs without D1 database.
   For D1 support, use: npm run dev:cf
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

serve({
  fetch: app.fetch,
  port,
});
