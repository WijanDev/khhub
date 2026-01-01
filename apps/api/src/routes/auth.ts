import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { getAuth } from '../lib/auth';
import { createDb } from '../db';
import { users, verifications } from '../db/schema';
import { eq } from 'drizzle-orm';

// Chain routes for proper type inference (Hono RPC)
// Define specific routes before catch-all to ensure proper typing
const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>()
  /**
   * Custom forgot password endpoint
   * Since Better Auth may not expose this by default
   */
  .post('/forget-password', async (c) => {
  try {
    const { email, redirectTo } = await c.req.json<{ email: string; redirectTo?: string }>();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const db = createDb(c.env.DB);

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({ status: 'ok' });
    }

    // Generate reset token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store verification token
    await db.insert(verifications).values({
      id: crypto.randomUUID(),
      identifier: email,
      value: token,
      expiresAt: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Build reset URL
    const baseURL = getBaseURL(c.req.url);
    const resetPath = redirectTo || '/auth/reset-password';
    const resetUrl = `${baseURL}${resetPath}?token=${token}`;

    // Log for development (in production, send via email service)
    console.log('========================================');
    console.log('PASSWORD RESET EMAIL');
    console.log('========================================');
    console.log(`To: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Token: ${token}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('========================================');

    // Send email if Resend API key is configured
    if (c.env.RESEND_API_KEY) {
      await sendPasswordResetEmail({
        apiKey: c.env.RESEND_API_KEY,
        to: user.email,
        name: user.name,
        resetUrl,
      });
    }

    return c.json({ status: 'ok' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ error: 'Failed to process request' }, 500);
  }
})
  /**
   * Custom reset password endpoint
   */
  .post('/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json<{ token: string; newPassword: string }>();

    if (!token || !newPassword) {
      return c.json({ error: 'Token and new password are required' }, 400);
    }

    if (newPassword.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    const db = createDb(c.env.DB);

    // Find verification token
    const verification = await db.query.verifications.findFirst({
      where: eq(verifications.value, token),
    });

    if (!verification) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    // Check if token is expired
    const expiresAt = new Date(verification.expiresAt);
    if (expiresAt < new Date()) {
      // Delete expired token
      await db.delete(verifications).where(eq(verifications.id, verification.id));
      return c.json({ error: 'Reset token has expired' }, 400);
    }

    // Find user by email (identifier)
    const user = await db.query.users.findFirst({
      where: eq(users.email, verification.identifier),
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 400);
    }

    // Use Better Auth's resetPassword API method
    const auth = getAuth(c);

    // Call Better Auth's resetPassword method
    // Better Auth expects token as query param and newPassword in body
    const result = await auth.api.resetPassword({
      query: { token },
      body: { newPassword },
    });

    if (!result || (result as any).error) {
      return c.json({ error: (result as any).error || 'Failed to reset password' }, 400);
    }

    // Delete the used verification token
    await db.delete(verifications).where(eq(verifications.id, verification.id));

    return c.json({ status: 'ok' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
})
  /**
   * Better Auth handler for all other auth routes
   * This catch-all must be last to allow specific routes above to be typed correctly
   */
  .all('/*', async (c) => {
  const auth = getAuth(c);

  // Better Auth expects /api/auth/* but we're mounted at /auth/*
  // Rewrite the request URL to match Better Auth's expectations
  const url = new URL(c.req.url);
  const originalPath = url.pathname;
  
  // If the path starts with /auth, rewrite it to /api/auth for Better Auth
  if (originalPath.startsWith('/auth/')) {
    url.pathname = originalPath.replace(/^\/auth/, '/api/auth');
  } else if (originalPath === '/auth') {
    url.pathname = '/api/auth';
  }

  // Create a new request with the rewritten URL
  const rewrittenRequest = new Request(url.toString(), {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });

  return auth.handler(rewrittenRequest);
});

/**
 * Get base URL from request
 */
function getBaseURL(url: string): string {
  const urlObj = new URL(url);
  return `${urlObj.protocol}//${urlObj.host}`;
}

/**
 * Send password reset email via Resend
 */
async function sendPasswordResetEmail(options: {
  apiKey: string;
  to: string;
  name: string;
  resetUrl: string;
}) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'KH Hub <noreply@yourdomain.com>',
      to: options.to,
      subject: 'Reset your password - KH Hub',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e8e8f0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #15151f 0%, #1a1a28 100%); border-radius: 12px; padding: 40px; border: 1px solid rgba(255, 255, 255, 0.06);">
    <h1 style="margin: 0 0 24px; font-size: 24px; color: #00d4ff;">KH Hub</h1>
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">Reset your password</h2>
    <p style="margin: 0 0 24px; color: #9090a0; line-height: 1.6;">
      Hi ${options.name},<br><br>
      We received a request to reset your password. Click the button below to choose a new password.
    </p>
    <a href="${options.resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); color: #0a0a0f; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Reset Password
    </a>
    <p style="margin: 24px 0 0; color: #606070; font-size: 13px; line-height: 1.6;">
      If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.
    </p>
  </div>
</body>
</html>
`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

export default authRoutes;
