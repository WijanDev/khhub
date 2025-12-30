-- Migration: Initial multi-tenant schema
-- Created at: 2024-12-30

-- Tenants table (organizations/companies)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Tenant database connections
CREATE TABLE IF NOT EXISTS tenant_connections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  db_type TEXT NOT NULL CHECK (db_type IN ('postgresql', 'mysql', 'sqlite', 'd1')),
  connection_string TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(tenant_id, name)
);

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  email_verified INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- User-Tenant memberships (authorization)
CREATE TABLE IF NOT EXISTS user_tenants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, tenant_id)
);

-- Sessions table (for auth tokens)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_connections_tenant ON tenant_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- Seed data for development
INSERT INTO tenants (id, name, slug) VALUES 
  ('tenant-001', 'Acme Corp', 'acme'),
  ('tenant-002', 'Stark Industries', 'stark');

INSERT INTO tenant_connections (tenant_id, name, db_type, connection_string, is_primary) VALUES
  ('tenant-001', 'main', 'postgresql', 'postgresql://user:pass@localhost:5432/acme_db', 1),
  ('tenant-001', 'analytics', 'postgresql', 'postgresql://user:pass@localhost:5432/acme_analytics', 0),
  ('tenant-002', 'main', 'mysql', 'mysql://user:pass@localhost:3306/stark_db', 1);

-- Dev user (password: "password123" - bcrypt hash placeholder)
INSERT INTO users (id, email, password_hash, name) VALUES 
  ('user-001', 'admin@example.com', '$2a$10$placeholder', 'Admin User'),
  ('user-002', 'alice@example.com', '$2a$10$placeholder', 'Alice Johnson');

INSERT INTO user_tenants (user_id, tenant_id, role) VALUES
  ('user-001', 'tenant-001', 'owner'),
  ('user-001', 'tenant-002', 'admin'),
  ('user-002', 'tenant-001', 'member');

