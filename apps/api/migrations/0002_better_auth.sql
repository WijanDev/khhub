-- Migration: Better Auth schema
-- Updates existing tables and adds new auth tables

-- Drop old tables (will recreate with new schema)
DROP TABLE IF EXISTS user_tenants;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Create user table (Better Auth compatible)
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER DEFAULT 0,
  image TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  banned INTEGER DEFAULT 0,
  ban_reason TEXT,
  ban_expires INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create session table (Better Auth compatible)
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  impersonated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create account table (Better Auth - OAuth providers)
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TEXT,
  refresh_token_expires_at TEXT,
  scope TEXT,
  password TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create verification table (Better Auth - email verification, password reset)
CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Recreate user_tenants table with reference to new user table
CREATE TABLE IF NOT EXISTS user_tenants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON account(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verification(identifier);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id);

-- Seed admin user (password will be set via auth flow)
INSERT INTO user (id, name, email, role, email_verified) VALUES 
  ('admin-001', 'Admin User', 'admin@example.com', 'admin', 1);

-- Add admin to Acme Corp tenant
INSERT INTO user_tenants (id, user_id, tenant_id, role) VALUES
  ('ut-001', 'admin-001', 'tenant-001', 'owner');

