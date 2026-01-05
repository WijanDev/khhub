import type { TenantConnection } from '../types';

interface RawTenantConnection {
  id: string;
  tenant_id: string;
  name: string;
  db_type: string;
  connection_string: string;
  is_primary: number;
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  updated_at: string;
}

/**
 * Tenant Database Manager
 * Handles dynamic connections to tenant-specific databases
 */
export class TenantDbManager {
  private connections: Map<string, TenantConnection[]> = new Map();

  constructor(private centralDb: D1Database) { }

  /**
   * Get all connections for a tenant
   */
  async getConnections(tenantId: string): Promise<TenantConnection[]> {
    // Check cache first
    if (this.connections.has(tenantId)) {
      return this.connections.get(tenantId)!;
    }

    // Fetch from central DB
    const { results } = await this.centralDb
      .prepare('SELECT * FROM tenant_connections WHERE tenant_id = ? AND status = ?')
      .bind(tenantId, 'active')
      .all<RawTenantConnection>();

    const mappedResults: TenantConnection[] = results.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      dbType: (row.db_type as 'd1' | 'postgresql' | 'mysql' | 'sqlite'),
      connectionString: row.connection_string,
      isPrimary: row.is_primary === 1 ? true : null,
      status: row.status as 'active' | 'inactive' | 'error' | null,
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
    }));

    this.connections.set(tenantId, mappedResults);
    return mappedResults;
  }

  /**
   * Get primary connection for a tenant
   */
  async getPrimaryConnection(tenantId: string): Promise<TenantConnection | null> {
    const connections = await this.getConnections(tenantId);
    return connections.find((c) => c.isPrimary === true) || connections[0] || null;
  }

  /**
   * Get connection by name
   */
  async getConnectionByName(tenantId: string, name: string): Promise<TenantConnection | null> {
    const connections = await this.getConnections(tenantId);
    return connections.find((c) => c.name === name) || null;
  }

  /**
   * Create a database client for a tenant connection
   * Returns connection info for D1 database
   */
  async createClient(
    tenantId: string,
    connectionName?: string
  ): Promise<{ connection: TenantConnection; connectionString: string } | null> {
    const connection = connectionName
      ? await this.getConnectionByName(tenantId, connectionName)
      : await this.getPrimaryConnection(tenantId);

    if (!connection) {
      return null;
    }

    return {
      connection,
      connectionString: connection.connectionString,
    };
  }

  /**
   * Clear cached connections for a tenant
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      this.connections.delete(tenantId);
    } else {
      this.connections.clear();
    }
  }
}

/**
 * Factory function to create TenantDbManager
 */
export function createTenantDbManager(centralDb: D1Database): TenantDbManager {
  return new TenantDbManager(centralDb);
}

