import { ZodError, ZodType } from 'zod';

// Re-export all schemas from types
export {
  // Auth
  SignInSchema,
  SignUpSchema,
  SignUpWithConfirmSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ResetPasswordWithConfirmSchema,
  ChangePasswordSchema,
  ChangePasswordWithConfirmSchema,
  // Tenant
  CreateTenantSchema,
  UpdateTenantSchema,
  CreateConnectionSchema,
  UpdateConnectionSchema,
  // User
  CreateUserSchema,
  UpdateUserSchema,
  UpdateProfileSchema,
  AddUserToTenantSchema,
  UpdateUserRoleSchema,
  // Common
  PaginationParamsSchema,
} from '../types';

// Re-export types
export type {
  // Auth
  SignInInput,
  SignUpInput,
  SignUpWithConfirmInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ResetPasswordWithConfirmInput,
  ChangePasswordInput,
  ChangePasswordWithConfirmInput,
  // Tenant
  CreateTenantInput,
  UpdateTenantInput,
  CreateConnectionInput,
  UpdateConnectionInput,
  // User
  CreateUserInput,
  UpdateUserInput,
  UpdateProfileInput,
  AddUserToTenantInput,
  UpdateUserRoleInput,
  // Common
  PaginationParams,
} from '../types';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Convert Zod errors to our format
 */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Validate input against a Zod schema
 */
export function validate<T>(schema: ZodType<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Parse and validate input, throwing on error
 */
export function parse<T>(schema: ZodType<T>, input: unknown): T {
  return schema.parse(input);
}

/**
 * Safe parse input, returning null on error
 */
export function safeParse<T>(schema: ZodType<T>, input: unknown): T | null {
  const result = schema.safeParse(input);
  return result.success ? result.data : null;
}

/**
 * Get error messages from validation result
 */
export function getErrorMessages(errors: ValidationError[]): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const error of errors) {
    messages[error.path || 'general'] = error.message;
  }
  return messages;
}

/**
 * Format errors for API response
 */
export function formatApiErrors(errors: ValidationError[]): { error: string; details: Record<string, string[]> } {
  const details: Record<string, string[]> = {};

  for (const error of errors) {
    const key = error.path || 'general';
    if (!details[key]) {
      details[key] = [];
    }
    details[key].push(error.message);
  }

  return {
    error: 'Validation failed',
    details,
  };
}

// Re-export Zod for custom schemas
export { z, ZodError, type ZodType } from 'zod';