import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { getAuth } from '../lib/auth';

/**
 * Auth routes - all handled by Better Auth
 * Better Auth provides default endpoints for:
 * - POST /auth/sign-up
 * - POST /auth/sign-in
 * - POST /auth/sign-out
 * - POST /auth/forget-password
 * - POST /auth/reset-password
 * - POST /auth/verify-email
 * - POST /auth/resend-verification
 * - GET /auth/session
 * - And more...
 */
const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>().all('/*', async (c) => {
  const auth = getAuth(c);
  const response = await auth.handler(c.req.raw);
  
  // Log 403 errors for debugging
  if (response.status === 403) {
    try {
      const text = await response.clone().text();
      console.log('Better Auth 403 Response Body:', text);
    } catch (e) {
      console.log('Could not read response body:', e);
    }
  }

  return response;
});

export default authRoutes;
