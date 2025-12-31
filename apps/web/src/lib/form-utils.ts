import { z } from 'zod';
import type { ZodSchema } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Extract error message from TanStack Form field errors
 * Returns the raw error message (translation key)
 */
function extractErrorMessage(errors: unknown[]): string | null {
  if (!errors || errors.length === 0) return null;

  const error = errors[0];

  // If it's a string, return it directly
  if (typeof error === 'string') {
    return error;
  }

  // If it's a ZodError, extract the first issue message
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || null;
  }

  // If it's an object with 'message' property
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    
    if ('message' in errorObj && typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    
    // Check for issues array (ZodError-like)
    if ('issues' in errorObj && Array.isArray(errorObj.issues)) {
      const firstIssue = errorObj.issues[0] as { message?: string } | undefined;
      return firstIssue?.message || null;
    }
  }

  // Fallback: convert to string if it's not an empty object
  const str = String(error);
  return str !== '[object Object]' ? str : null;
}

/**
 * Get translated error message from TanStack Form field errors
 * Translates the error message using the provided t function
 */
export function getFieldError(errors: unknown[], t: TFunction): string | null {
  const message = extractErrorMessage(errors);
  if (!message) return null;
  
  // Translate the message
  return t(message);
}

/**
 * Check if field has errors and should display them
 * Only shows errors after the field has been blurred at least once
 */
export function hasFieldError(isBlurred: boolean, errors: unknown[]): boolean {
  return isBlurred && errors && errors.length > 0;
}

/**
 * Create a TanStack Form validator from a Zod schema
 * This properly formats the errors for form-level validation
 */
export function zodValidator<T>(schema: ZodSchema<T>) {
  return ({ value }: { value: T }) => {
    const result = schema.safeParse(value);
    if (result.success) {
      return undefined;
    }
    
    // Convert Zod errors to field errors map
    const fieldErrors: Record<string, string> = {};
    
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || '_root';
      if (!fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    
    return fieldErrors;
  };
}

/**
 * Create a field-level validator from a Zod schema's field
 * Returns the error message directly for single field validation
 */
export function zodFieldValidator<T>(schema: ZodSchema<T>) {
  return ({ value }: { value: T }) => {
    const result = schema.safeParse(value);
    if (result.success) {
      return undefined;
    }
    // Return the first error message (translation key)
    return result.error.issues[0]?.message;
  };
}
