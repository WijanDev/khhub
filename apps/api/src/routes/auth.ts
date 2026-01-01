import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { getAuth } from '../lib/auth';

const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>()
  .post('/forget-password', async (c) => {
    try {
      const { email, redirectTo } = await c.req.json<{ email: string; redirectTo?: string }>();

      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }
      const auth = getAuth(c);

      const result = await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo,
        },
      });

      if (!result || (result as any).error) {
        return c.json({ error: (result as any).error || 'Failed to request password reset' }, 400);
      }

      return c.json({ status: 'ok' });
    } catch (error) {
      console.error('Forgot password error:', error);
      return c.json({ error: 'Failed to process request' }, 500);
    }
  })
  .post('/resend-verification', async (c) => {
    try {
      const { email } = await c.req.json<{ email: string }>();

      if (!email) {
        return c.json({ error: 'Email is required' }, 400);
      }

      const auth = getAuth(c);

      const result = await auth.api.sendVerificationEmail({
        body: {
          email,
        },
      });

      return c.json({ status: 'ok' });
    } catch (error) {
      console.error('Resend verification error:', error);
      return c.json({ error: 'Failed to process request' }, 500);
    }
  })
  .post('/verify-email', async (c) => {
    const { token, redirectTo } = await c.req.json<{ token: string; redirectTo?: string }>();

    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    try {
      const auth = getAuth(c);

      const result = await auth.api.verifyEmail({
        query: {
          token,
          callbackURL: redirectTo,
        },
      });
      
      if (result && typeof result === 'object' && 'statusCode' in result) {
        const statusCode = (result as { statusCode?: number }).statusCode;
        if (statusCode === 302 || statusCode === 301) {
          return c.json({ status: 'ok', redirectTo: redirectTo || '/auth/signin' });
        }
      }

      if (result && typeof result === 'object' && 'error' in result) {
        const error = (result as { error?: unknown }).error;
        return c.json({ error: typeof error === 'string' ? error : 'Failed to verify email' }, 400);
      }

      return c.json({ status: 'ok', redirectTo: redirectTo || '/auth/signin' });
    } catch (error) {
      console.error('Verify email error:', error);

      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 302 || statusCode === 301) {
          return c.json({ status: 'ok', redirectTo: redirectTo || '/auth/signin' });
        }
      }

      return c.json({ error: 'Failed to verify email' }, 500);
    }
  })
  .post('/reset-password', async (c) => {
    try {
      const { token, newPassword } = await c.req.json<{ token: string; newPassword: string }>();
      const auth = getAuth(c);

      const result = await auth.api.resetPassword({
        body: { newPassword, token },
      });

      if (!result || (result as any).error) {
        return c.json({ error: (result as any).error || 'Failed to reset password' }, 400);
      }

      return c.json({ status: 'ok' });
    } catch (error) {
      console.error('Reset password error:', error);
      return c.json({ error: 'Failed to reset password' }, 500);
    }
  })
  .all('/*', async (c) => {
    const auth = getAuth(c);
    const response = await auth.handler(c.req.raw);
    if (response.status === 403) {
      try {
        const text = await response.clone().text();
        console.log('Response Body:', text);
      } catch (e) {
        console.log('Could not read response body:', e);
      }
    }

    return response;
  });

export default authRoutes;
