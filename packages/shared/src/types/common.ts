import { z } from 'zod';

/**
 * Common types and schemas used across the application
 */

// Status types
export const TenantStatusSchema = z.enum(['active', 'inactive', 'suspended']);
export type TenantStatus = z.infer<typeof TenantStatusSchema>;

export const UserStatusSchema = z.enum(['active', 'inactive', 'suspended']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const ConnectionStatusSchema = z.enum(['active', 'inactive', 'error']);
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;

export const UserRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const DbTypeSchema = z.enum(['postgresql', 'mysql', 'sqlite', 'd1']);
export type DbType = z.infer<typeof DbTypeSchema>;

// Pagination
export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

