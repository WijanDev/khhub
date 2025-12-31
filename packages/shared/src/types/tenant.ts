import { z } from 'zod';
import { TenantStatusSchema, ConnectionStatusSchema, DbTypeSchema } from './common';

/**
 * Tenant related schemas and types
 * All messages use translation keys that should be translated by the client
 */

// Base Tenant
export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: TenantStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Tenant = z.infer<typeof TenantSchema>;

// Create Tenant
export const CreateTenantSchema = z.object({
  name: z.string().min(2, 'validation.name.minLength').max(100, 'validation.name.maxLength'),
  slug: z
    .string()
    .min(2, 'validation.slug.minLength')
    .max(50, 'validation.slug.maxLength')
    .regex(/^[a-z0-9-]+$/, 'validation.slug.format'),
});
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

// Update Tenant
export const UpdateTenantSchema = z.object({
  name: z.string().min(2, 'validation.name.minLength').max(100, 'validation.name.maxLength').optional(),
  status: TenantStatusSchema.optional(),
});
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;

// Tenant Connection
export const TenantConnectionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  dbType: DbTypeSchema,
  connectionString: z.string(),
  isPrimary: z.boolean(),
  status: ConnectionStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TenantConnection = z.infer<typeof TenantConnectionSchema>;

// Create Connection
export const CreateConnectionSchema = z.object({
  name: z.string().min(2, 'validation.name.minLength').max(100, 'validation.name.maxLength'),
  db_type: DbTypeSchema,
  connection_string: z.string().min(1, 'validation.connectionString.required').max(500, 'validation.connectionString.maxLength'),
  is_primary: z.boolean().optional().default(false),
});
export type CreateConnectionInput = z.infer<typeof CreateConnectionSchema>;

// Update Connection
export const UpdateConnectionSchema = z.object({
  name: z.string().min(2, 'validation.name.minLength').max(100, 'validation.name.maxLength').optional(),
  connection_string: z.string().min(1, 'validation.connectionString.required').max(500, 'validation.connectionString.maxLength').optional(),
  is_primary: z.boolean().optional(),
  status: ConnectionStatusSchema.optional(),
});
export type UpdateConnectionInput = z.infer<typeof UpdateConnectionSchema>;

// Tenant with connections
export const TenantWithConnectionsSchema = TenantSchema.extend({
  connections: z.array(TenantConnectionSchema),
});
export type TenantWithConnections = z.infer<typeof TenantWithConnectionsSchema>;
