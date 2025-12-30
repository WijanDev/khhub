import type { TenantConnection, DbType } from '../types';

/**
 * Tenant Database Manager
 * Handles dynamic connections to tenant-specific databases
 */
export class TenantDbManager {
  private connections: Map<string, TenantConnection[]> = new Map();

  constructor(private centralDb: D1Database) {}

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
      .all<TenantConnection>();

    this.connections.set(tenantId, results);
    return results;
  }

  /**
   * Get primary connection for a tenant
   */
  async getPrimaryConnection(tenantId: string): Promise<TenantConnection | null> {
    const connections = await this.getConnections(tenantId);
    return connections.find((c) => c.is_primary === 1) || connections[0] || null;
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
   * Returns connection info - actual client creation depends on db_type
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
      connectionString: connection.connection_string,
    };
  }

  /**
   * Parse connection string to get database details
   */
  parseConnectionString(connectionString: string, dbType: DbType): ConnectionDetails {
    // Handle different connection string formats
    const url = new URL(connectionString.replace(/^(postgresql|mysql):/, 'http:'));

    return {
      host: url.hostname,
      port: parseInt(url.port) || getDefaultPort(dbType),
      database: url.pathname.slice(1),
      username: url.username,
      password: url.password,
      ssl: url.searchParams.get('ssl') === 'true',
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

interface ConnectionDetails {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

function getDefaultPort(dbType: DbType): number {
  switch (dbType) {
    case 'postgresql':
      return 5432;
    case 'mysql':
      return 3306;
    default:
      return 0;
  }
}

/**
 * Factory function to create TenantDbManager
 */
export function createTenantDbManager(centralDb: D1Database): TenantDbManager {
  return new TenantDbManager(centralDb);
}

