// Environment bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
  ENVIRONMENT?: string;
  JWT_SECRET?: string;
}

// Hono context variables
export interface Variables {
  userId?: string;
  tenantId?: string;
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
} from './db/schema';
