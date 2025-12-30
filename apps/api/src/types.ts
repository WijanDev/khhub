// Environment bindings
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
  ENVIRONMENT?: string;
  JWT_SECRET?: string;
}

// Database types
export type DbType = 'postgresql' | 'mysql' | 'sqlite' | 'd1';
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type Status = 'active' | 'inactive' | 'suspended' | 'error';

// Core entities
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface TenantConnection {
  id: string;
  tenant_id: string;
  name: string;
  db_type: DbType;
  connection_string: string;
  is_primary: number;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar_url: string | null;
  email_verified: number;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

// API response types
export interface UserWithTenants extends Omit<User, 'password_hash'> {
  tenants: Array<{
    tenant: Tenant;
    role: UserRole;
  }>;
}

export interface TenantWithConnections extends Tenant {
  connections: TenantConnection[];
}

// Request context
export interface AuthContext {
  user: User;
  currentTenant?: Tenant;
  role?: UserRole;
}

// Hono context variables
export interface Variables {
  auth?: AuthContext;
  tenantId?: string;
}
