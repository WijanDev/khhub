import { zValidator } from '@hono/zod-validator';
import { z, type ZodType } from 'zod';

/**
 * Validation middleware for Hono API routes using Zod
 */

/**
 * Format validation errors for consistent API responses
 */
function formatErrors(errors: z.core.$ZodIssue[]): { error: string; details: Record<string, string[]> } {
  const details: Record<string, string[]> = {};

  errors.forEach((issue) => {
    const path = issue.path.join('.') || 'general';
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  });

  return {
    error: 'Validation failed',
    details,
  };
}

/**
 * Validate JSON body
 */
export function validateJson<T extends ZodType>(schema: T) {
  return zValidator('json', schema, (result, c) => {
    if (!result.success && result.error) {
      return c.json(formatErrors(result.error.issues), 400);
    }
  });
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends ZodType>(schema: T) {
  return zValidator('query', schema, (result, c) => {
    if (!result.success && result.error) {
      return c.json(formatErrors(result.error.issues), 400);
    }
  });
}

/**
 * Validate URL parameters
 */
export function validateParam<T extends ZodType>(schema: T) {
  return zValidator('param', schema, (result, c) => {
    if (!result.success && result.error) {
      return c.json(formatErrors(result.error.issues), 400);
    }
  });
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

