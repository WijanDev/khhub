import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, Database } from '../index';
import { createMockD1 } from '../../test/setup';
import * as schema from '../schema';

describe('Database', () => {
  let mockD1: D1Database;

  beforeEach(() => {
    mockD1 = createMockD1();
  });

  describe('createDb', () => {
    it('should create a drizzle database instance', () => {
      const db = createDb(mockD1);
      
      expect(db).toBeDefined();
      expect(db).toHaveProperty('select');
      expect(db).toHaveProperty('insert');
      expect(db).toHaveProperty('update');
      expect(db).toHaveProperty('delete');
      expect(db).toHaveProperty('query');
    });

    it('should include schema in database instance', () => {
      const db = createDb(mockD1);
      
      expect(db).toHaveProperty('query');
      expect(db.query).toHaveProperty('tenants');
      expect(db.query).toHaveProperty('users');
      expect(db.query).toHaveProperty('userTenants');
    });

    it('should accept D1Database instance', () => {
      const db = createDb(mockD1);
      
      expect(db).toBeDefined();
    });
  });

  describe('Database type', () => {
    it('should export Database type', () => {
      const db = createDb(mockD1);
      const typedDb: Database = db;
      
      expect(typedDb).toBeDefined();
    });
  });

  describe('Schema re-exports', () => {
    it('should re-export schema tables', async () => {
      const dbModule = await import('../index');
      
      expect(dbModule).toHaveProperty('tenants');
      expect(dbModule).toHaveProperty('users');
      expect(dbModule).toHaveProperty('userTenants');
      expect(dbModule).toHaveProperty('sessions');
      expect(dbModule).toHaveProperty('accounts');
      expect(dbModule.tenants).toBe(schema.tenants);
      expect(dbModule.users).toBe(schema.users);
    });

    it('should re-export schema relations', async () => {
      const dbModule = await import('../index');
      
      expect(dbModule).toHaveProperty('tenantsRelations');
      expect(dbModule).toHaveProperty('usersRelations');
      expect(dbModule).toHaveProperty('userTenantsRelations');
    });
  });
});
