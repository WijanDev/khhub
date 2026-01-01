import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import type { D1Database } from '@cloudflare/workers-types';
import type { Context } from 'hono';
import type { Env, Variables } from '../types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

interface AuthOptions {
  baseURL: string;
  secret: string;
  resendApiKey?: string;
}

/**
 * Create Better Auth instance for Cloudflare Workers
 * Must be called per-request since we need the D1 binding
 */
export function createAuth(d1: D1Database, options: AuthOptions) {
  const db = drizzle(d1, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    baseURL: options.baseURL,
    basePath: '/auth', // Use /auth instead of default /api/auth
    secret: options.secret,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      // Enable password reset
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      // Password reset email handler
      sendResetPassword: async ({ user, url, token }) => {
        console.log('========================================');
        console.log('PASSWORD RESET EMAIL');
        console.log('========================================');
        console.log(`To: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Token: ${token}`);
        console.log(`Reset URL: ${url}`);
        console.log('========================================');

        // For production, use Resend or another email provider
        if (options.resendApiKey) {
          await sendEmailWithResend({
            apiKey: options.resendApiKey,
            to: user.email,
            subject: 'Reset your password - KH Hub',
            html: getPasswordResetEmailHtml(user.name, url),
          });
        }
      },
    },
    plugins: [
      admin(),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:4173',
      'https://khhub-web.pages.dev',
    ],
  });
}

/**
 * Send email using Resend API (works in Cloudflare Workers)
 */
async function sendEmailWithResend(options: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
}) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'KH Hub <noreply@yourdomain.com>', // Update with your verified domain
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Password reset email HTML template
 */
function getPasswordResetEmailHtml(name: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e8e8f0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #15151f 0%, #1a1a28 100%); border-radius: 12px; padding: 40px; border: 1px solid rgba(255, 255, 255, 0.06);">
    <h1 style="margin: 0 0 24px; font-size: 24px; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ff006a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
      KH Hub
    </h1>
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">
      Reset your password
    </h2>
    <p style="margin: 0 0 24px; color: #9090a0; line-height: 1.6;">
      Hi ${name},<br><br>
      We received a request to reset your password. Click the button below to choose a new password.
    </p>
    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); color: #0a0a0f; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Reset Password
    </a>
    <p style="margin: 24px 0 0; color: #606070; font-size: 13px; line-height: 1.6;">
      If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.
    </p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.06);">
    <p style="margin: 0; color: #606070; font-size: 12px;">
      This email was sent by KH Hub. If you have questions, contact support.
    </p>
  </div>
</body>
</html>
`;
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * Get Better Auth instance from Hono context
 * Centralizes auth creation logic for reuse across routes and middleware
 */
export function getAuth(c: { env: Env; req: { url: string } }): Auth {
  return createAuth(c.env.DB, {
    baseURL: getBaseURL(c.req.url),
    secret: c.env.AUTH_SECRET || 'development-secret-change-in-production',
    resendApiKey: c.env.RESEND_API_KEY,
  });
}

/**
 * Get base URL from request URL
 */
function getBaseURL(url: string): string {
  const urlObj = new URL(url);
  return `${urlObj.protocol}//${urlObj.host}`;
}
