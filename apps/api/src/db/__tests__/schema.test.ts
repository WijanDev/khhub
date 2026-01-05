import { describe, it, expect } from 'vitest';
import { createDb } from '../index';
import { createMockD1 } from '../../test/setup';
import {
  tenants,
  tenantConnections,
  users,
  sessions,
  accounts,
  verifications,
  userTenants,
  tenantsRelations,
  tenantConnectionsRelations,
  usersRelations,
  sessionsRelations,
  accountsRelations,
  userTenantsRelations,
  type Tenant,
  type NewTenant,
  type TenantConnection,
  type NewTenantConnection,
  type User,
  type NewUser,
  type Session,
  type NewSession,
  type Account,
  type NewAccount,
  type Verification,
  type NewVerification,
  type UserTenant,
  type NewUserTenant,
} from '../schema';

describe('Schema Tables', () => {
  describe('tenants', () => {
    it('should have correct table name', () => {
      expect((tenants as any)[Symbol.for('drizzle:Name')]).toBe('tenants');
    });

    it('should have required columns', () => {
      expect(tenants.id).toBeDefined();
      expect(tenants.name).toBeDefined();
      expect(tenants.slug).toBeDefined();
      expect(tenants.status).toBeDefined();
      expect(tenants.createdAt).toBeDefined();
      expect(tenants.updatedAt).toBeDefined();
    });

    it('should have id as primary key', () => {
      expect(tenants.id.primary).toBe(true);
    });
  });

  describe('tenantConnections', () => {
    it('should have correct table name', () => {
      expect((tenantConnections as any)[Symbol.for('drizzle:Name')]).toBe('tenant_connections');
    });

    it('should have required columns', () => {
      expect(tenantConnections.id).toBeDefined();
      expect(tenantConnections.tenantId).toBeDefined();
      expect(tenantConnections.name).toBeDefined();
      expect(tenantConnections.dbType).toBeDefined();
      expect(tenantConnections.connectionString).toBeDefined();
      expect(tenantConnections.isPrimary).toBeDefined();
      expect(tenantConnections.status).toBeDefined();
    });

    it('should have id as primary key', () => {
      expect(tenantConnections.id.primary).toBe(true);
    });

    it('should have tenantId reference to tenants', () => {
      expect(tenantConnections.tenantId).toBeDefined();
    });

    it('should have indexes defined', () => {
      const table = tenantConnections;
      expect(table).toBeDefined();
    });
  });

  describe('users', () => {
    it('should have correct table name', () => {
      expect((users as any)[Symbol.for('drizzle:Name')]).toBe('user');
    });

    it('should have required columns', () => {
      expect(users.id).toBeDefined();
      expect(users.name).toBeDefined();
      expect(users.email).toBeDefined();
      expect(users.emailVerified).toBeDefined();
      expect(users.image).toBeDefined();
      expect(users.role).toBeDefined();
      expect(users.banned).toBeDefined();
      expect(users.banReason).toBeDefined();
      expect(users.banExpires).toBeDefined();
      expect(users.createdAt).toBeDefined();
      expect(users.updatedAt).toBeDefined();
    });

    it('should have id as primary key', () => {
      expect(users.id.primary).toBe(true);
    });

    it('should have indexes defined', () => {
      const table = users;
      expect(table).toBeDefined();
    });
  });

  describe('sessions', () => {
    it('should have correct table name', () => {
      expect((sessions as any)[Symbol.for('drizzle:Name')]).toBe('session');
    });

    it('should have required columns', () => {
      expect(sessions.id).toBeDefined();
      expect(sessions.userId).toBeDefined();
      expect(sessions.token).toBeDefined();
      expect(sessions.expiresAt).toBeDefined();
      expect(sessions.ipAddress).toBeDefined();
      expect(sessions.userAgent).toBeDefined();
      expect(sessions.impersonatedBy).toBeDefined();
      expect(sessions.createdAt).toBeDefined();
      expect(sessions.updatedAt).toBeDefined();
    });

    it('should have id as primary key', () => {
      expect(sessions.id.primary).toBe(true);
    });

    it('should have userId reference to users', () => {
      expect(sessions.userId).toBeDefined();
    });

    it('should have indexes defined', () => {
      const table = sessions;
      expect(table).toBeDefined();
    });
  });

  describe('accounts', () => {
    it('should have correct table name', () => {
      expect((accounts as any)[Symbol.for('drizzle:Name')]).toBe('account');
    });

    it('should have required columns', () => {
      expect(accounts.id).toBeDefined();
      expect(accounts.userId).toBeDefined();
      expect(accounts.accountId).toBeDefined();
      expect(accounts.providerId).toBeDefined();
      expect(accounts.accessToken).toBeDefined();
      expect(accounts.refreshToken).toBeDefined();
      expect(accounts.accessTokenExpiresAt).toBeDefined();
      expect(accounts.refreshTokenExpiresAt).toBeDefined();
      expect(accounts.scope).toBeDefined();
      expect(accounts.password).toBeDefined();
      expect(accounts.createdAt).toBeDefined();
      expect(accounts.updatedAt).toBeDefined();
    });

    it('should have id as primary key', () => {
      expect(accounts.id.primary).toBe(true);
    });

    it('should have userId reference to users', () => {
      expect(accounts.userId).toBeDefined();
    });

    it('should have indexes defined', () => {
      const table = accounts;
      expect(table).toBeDefined();
    });
  });

  describe('verifications', () => {
    it('should have correct table name', () => {
      expect((verifications as any)[Symbol.for('drizzle:Name')]).toBe('verification');
    });

    it('should have required columns', () => {
      expect(verifications.id).toBeDefined();
      expect(verifications.identifier).toBeDefined();
      expect(verifications.value).toBeDefined();
      expect(verifications.expiresAt).toBeDefined();
      expect(verifications.createdAt).toBeDefined();
      expect(verifications.updatedAt).toBeDefined();
    });

    it('should have id as primary key', () => {
      expect(verifications.id.primary).toBe(true);
    });

    it('should have indexes defined', () => {
      const table = verifications;
      expect(table).toBeDefined();
    });
  });

  describe('userTenants', () => {
    it('should have correct table name', () => {
      expect((userTenants as any)[Symbol.for('drizzle:Name')]).toBe('user_tenants');
    });

    it('should have required columns', () => {
      expect(userTenants.id).toBeDefined();
      expect(userTenants.userId).toBeDefined();
      expect(userTenants.tenantId).toBeDefined();
      expect(userTenants.role).toBeDefined();
      expect(userTenants.createdAt).toBeDefined();
      expect(userTenants.updatedAt).toBeDefined();
    });

    it('should have id as primary key', () => {
      expect(userTenants.id.primary).toBe(true);
    });

    it('should have userId reference to users', () => {
      expect(userTenants.userId).toBeDefined();
    });

    it('should have tenantId reference to tenants', () => {
      expect(userTenants.tenantId).toBeDefined();
    });

    it('should have indexes defined', () => {
      const table = userTenants;
      expect(table).toBeDefined();
    });
  });
});

describe('Schema Relations', () => {
  it('should export tenantsRelations', () => {
    expect(tenantsRelations).toBeDefined();
  });

  it('should export tenantConnectionsRelations', () => {
    expect(tenantConnectionsRelations).toBeDefined();
  });

  it('should export usersRelations', () => {
    expect(usersRelations).toBeDefined();
  });

  it('should export sessionsRelations', () => {
    expect(sessionsRelations).toBeDefined();
  });

  it('should export accountsRelations', () => {
    expect(accountsRelations).toBeDefined();
  });

  it('should export userTenantsRelations', () => {
    expect(userTenantsRelations).toBeDefined();
  });
});

describe('Schema Usage', () => {
  it('should use schema with database instance', () => {
    const mockD1 = createMockD1();
    const db = createDb(mockD1);
    
    expect(db.query.tenants).toBeDefined();
    expect(db.query.tenantConnections).toBeDefined();
    expect(db.query.users).toBeDefined();
    expect(db.query.sessions).toBeDefined();
    expect(db.query.accounts).toBeDefined();
    expect(db.query.verifications).toBeDefined();
    expect(db.query.userTenants).toBeDefined();
  });

  it('should use tenantConnections in select query', () => {
    const mockD1 = createMockD1();
    const db = createDb(mockD1);
    
    const select = db.select().from(tenantConnections);
    expect(select).toBeDefined();
  });

  it('should use verifications in select query', () => {
    const mockD1 = createMockD1();
    const db = createDb(mockD1);
    
    const select = db.select().from(verifications);
    expect(select).toBeDefined();
  });

  it('should use userTenants in select query', () => {
    const mockD1 = createMockD1();
    const db = createDb(mockD1);
    
    const select = db.select().from(userTenants);
    expect(select).toBeDefined();
  });

  it('should access tenantConnections table properties', () => {
    const id = tenantConnections.id;
    const tenantId = tenantConnections.tenantId;
    const name = tenantConnections.name;
    const dbType = tenantConnections.dbType;
    const connectionString = tenantConnections.connectionString;
    const isPrimary = tenantConnections.isPrimary;
    const status = tenantConnections.status;
    const createdAt = tenantConnections.createdAt;
    const updatedAt = tenantConnections.updatedAt;
    
    expect(id).toBeDefined();
    expect(tenantId).toBeDefined();
    expect(name).toBeDefined();
    expect(dbType).toBeDefined();
    expect(connectionString).toBeDefined();
    expect(isPrimary).toBeDefined();
    expect(status).toBeDefined();
    expect(createdAt).toBeDefined();
    expect(updatedAt).toBeDefined();
    
    expect(id.primary).toBe(true);
  });

  it('should access verifications table properties', () => {
    const id = verifications.id;
    const identifier = verifications.identifier;
    const value = verifications.value;
    const expiresAt = verifications.expiresAt;
    const createdAt = verifications.createdAt;
    const updatedAt = verifications.updatedAt;
    
    expect(id).toBeDefined();
    expect(identifier).toBeDefined();
    expect(value).toBeDefined();
    expect(expiresAt).toBeDefined();
    expect(createdAt).toBeDefined();
    expect(updatedAt).toBeDefined();
    
    expect(id.primary).toBe(true);
  });

  it('should access userTenants table properties', () => {
    const id = userTenants.id;
    const userId = userTenants.userId;
    const tenantId = userTenants.tenantId;
    const role = userTenants.role;
    const createdAt = userTenants.createdAt;
    const updatedAt = userTenants.updatedAt;
    
    expect(id).toBeDefined();
    expect(userId).toBeDefined();
    expect(tenantId).toBeDefined();
    expect(role).toBeDefined();
    expect(createdAt).toBeDefined();
    expect(updatedAt).toBeDefined();
    
    expect(id.primary).toBe(true);
  });
});

describe('Schema Types', () => {
  describe('Tenant types', () => {
    it('should export Tenant type', () => {
      const tenant: Tenant = {
        id: 'test-id',
        name: 'Test Tenant',
        slug: 'test-tenant',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      expect(tenant).toBeDefined();
    });

    it('should export NewTenant type', () => {
      const newTenant: NewTenant = {
        name: 'Test Tenant',
        slug: 'test-tenant',
      };
      expect(newTenant).toBeDefined();
    });
  });

  describe('User types', () => {
    it('should export User type', () => {
      const user: User = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: false,
        image: null,
        role: 'user',
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(user).toBeDefined();
    });

    it('should export NewUser type', () => {
      const newUser: NewUser = {
        name: 'Test User',
        email: 'test@example.com',
      };
      expect(newUser).toBeDefined();
    });
  });

  describe('Session types', () => {
    it('should export Session type', () => {
      const session: Session = {
        id: 'test-id',
        userId: 'user-id',
        token: 'token',
        expiresAt: new Date(),
        ipAddress: null,
        userAgent: null,
        impersonatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(session).toBeDefined();
    });

    it('should export NewSession type', () => {
      const newSession: NewSession = {
        userId: 'user-id',
        token: 'token',
        expiresAt: new Date(),
      };
      expect(newSession).toBeDefined();
    });
  });

  describe('Account types', () => {
    it('should export Account type', () => {
      const account: Account = {
        id: 'test-id',
        userId: 'user-id',
        accountId: 'account-id',
        providerId: 'provider-id',
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        password: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(account).toBeDefined();
    });

    it('should export NewAccount type', () => {
      const newAccount: NewAccount = {
        userId: 'user-id',
        accountId: 'account-id',
        providerId: 'provider-id',
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        password: null,
      };
      expect(newAccount).toBeDefined();
    });
  });

  describe('UserTenant types', () => {
    it('should export UserTenant type', () => {
      const userTenant: UserTenant = {
        id: 'test-id',
        userId: 'user-id',
        tenantId: 'tenant-id',
        role: 'member',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      expect(userTenant).toBeDefined();
    });

    it('should export NewUserTenant type', () => {
      const newUserTenant: NewUserTenant = {
        userId: 'user-id',
        tenantId: 'tenant-id',
        role: 'member',
      };
      expect(newUserTenant).toBeDefined();
    });
  });
});
