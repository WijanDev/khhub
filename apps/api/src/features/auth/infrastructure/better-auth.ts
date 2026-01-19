import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '@shared/domain/types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@shared/infrastructure/db/schema';
import { type EmailService } from '@email/domain/types';
import { createEmailServiceFromEnv } from '@email/service';
import { EmailTemplates } from '@email/application/templates';

interface AuthOptions {
    baseURL: string;
    secret: string;
    emailService: EmailService;
    webAppUrl?: string;
    environment?: string;
}

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
        // Advanced configuration for Cloudflare Workers
        advanced: {
            // Disable origin check in development (enable in production)
            // This prevents 403 errors when origin header doesn't match trustedOrigins
            disableOriginCheck: options.environment !== 'production',
        },
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: true,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            // Password reset email handler
            sendResetPassword: async ({ user, token }) => {
                const resetPasswordUrl = `${options.webAppUrl}/auth/reset-password?token=${token}`;
                await options.emailService.sendEmail({
                    to: user.email,
                    subject: 'Reset your password - KH Hub',
                    html: EmailTemplates.passwordReset(user.name, resetPasswordUrl),
                });
            },
        },
        emailVerification: {
            enabled: true,
            sendOnSignUp: true,
            sendVerificationEmail: async ({ user, token }) => {
                const verificationUrl = `${options.webAppUrl}/auth/verify-email?token=${token}`;
                await options.emailService.sendEmail({
                    to: user.email,
                    subject: 'Verify your email - KH Hub',
                    html: EmailTemplates.emailVerification(user.name, verificationUrl),
                });
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

export type Auth = ReturnType<typeof createAuth>;

/**
 * Get Better Auth instance from Hono context
 * Centralizes auth creation logic for reuse across routes and middleware
 */
export function getAuth(c: { env: Env; req: { url: string } }): Auth {
    const emailService = createEmailServiceFromEnv(c.env);
    return createAuth(c.env.DB, {
        baseURL: getBaseURL(c.req.url),
        secret: c.env.AUTH_SECRET || 'development-secret-change-in-production',
        emailService,
        webAppUrl: c.env.WEB_APP_URL,
        environment: c.env.ENVIRONMENT,
    });
}

/**
 * Get base URL from request URL
 */
function getBaseURL(url: string): string {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
}
