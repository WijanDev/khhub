import { zValidator } from '@hono/zod-validator';
import { z, type ZodSchema } from 'zod';
import type { Context } from 'hono';

/**
 * Validation middleware for Hono API routes using Zod
 */

/**
 * Format validation errors for consistent API responses
 */
function formatErrors(errors: z.ZodIssue[]): { error: string; details: Record<string, string[]> } {
  const details: Record<string, string[]> = {};

  for (const issue of errors) {
    const path = issue.path.join('.') || 'general';
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }

  return {
    error: 'Validation failed',
    details,
  };
}

/**
 * Custom error hook for validation failures
 */
function errorHook(result: { success: boolean; error?: z.ZodError; data?: unknown }, c: Context) {
  if (!result.success && result.error) {
    return c.json(formatErrors(result.error.issues), 400);
  }
}

/**
 * Validate JSON body
 */
export function validateJson<T extends ZodSchema>(schema: T) {
  return zValidator('json', schema, errorHook);
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return zValidator('query', schema, errorHook);
}

/**
 * Validate URL parameters
 */
export function validateParam<T extends ZodSchema>(schema: T) {
  return zValidator('param', schema, errorHook);
}

/**
 * Create a parameterized ID schema
 */
export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

/**
 * Common ID + Tenant ID param schema
 */
export const IdTenantParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
});

/**
 * Common ID + Connection ID param schema
 */
export const IdConnectionParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  connectionId: z.string().min(1, 'Connection ID is required'),
});

