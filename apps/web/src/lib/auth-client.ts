import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8787',
  plugins: [adminClient()],
});

// Export hooks for convenience
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  useListSessions,
} = authClient;

// Type exports
export type Session = typeof authClient.$Infer.Session;
export type User = Session['user'];

