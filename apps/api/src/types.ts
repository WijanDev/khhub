// Environment bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
  ENVIRONMENT?: string;
  AUTH_SECRET?: string;
  RESEND_API_KEY?: string;
}

// Session type from Better Auth
export interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    role: 'user' | 'admin';
    banned: boolean;
    banReason: string | null;
    banExpires: number | null;
    createdAt: string;
    updatedAt: string;
  };
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    impersonatedBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Hono context variables
export interface Variables {
  userId?: string;
  tenantId?: string;
  session?: AuthSession;
}

// Re-export database types from schema
export type {
  Tenant,
  NewTenant,
  TenantConnection,
  NewTenantConnection,
  User,
  NewUser,
  UserTenant,
  NewUserTenant,
  Session,
  NewSession,
  Account,
  NewAccount,
  Verification,
  NewVerification,
} from './db/schema';
