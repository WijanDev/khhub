import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';
import { getApiBaseUrl } from './api-client';

// Better Auth by default appends /api/auth to baseURL
// We're using /auth, so configure basePath
export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
  basePath: '/auth',
  plugins: [adminClient()],
});

// Export hooks for convenience
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  verifyEmail,
  resetPassword,
  sendVerificationEmail,
  requestPasswordReset
} = authClient;

// Type exports
export type Session = typeof authClient.$Infer.Session;
export type User = Session['user'];

