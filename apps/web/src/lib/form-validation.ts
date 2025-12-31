import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { z, type ZodSchema, type ZodError } from 'zod';

/**
 * Form validation utilities using Zod
 * Error messages are translation keys that get translated automatically
 */

export interface FormErrors {
  [field: string]: string | undefined;
}

export interface UseFormValidationOptions<T> {
  schema: ZodSchema<T>;
  initialValues: Partial<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  /** If false, error messages won't be translated (useful for non-i18n contexts) */
  translateErrors?: boolean;
}

export interface UseFormValidationReturn<T> {
  values: Partial<T>;
  errors: FormErrors;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  touch: (field: keyof T) => void;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  getFieldProps: (field: keyof T) => {
    value: string | number | readonly string[];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    name: string;
  };
}

/**
 * Format Zod errors to a simple field->message map
 * @param translateFn - Optional translation function to translate error messages
 */
function formatZodErrors(error: ZodError, translateFn?: (key: string) => string): FormErrors {
  const errors: FormErrors = {};
  // Zod 4 uses .issues instead of .errors
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      // Translate the error message if it looks like a translation key
      const message = issue.message;
      const isTranslationKey = message.startsWith('validation.');
      errors[path] = isTranslationKey && translateFn ? translateFn(message) : message;
    }
  }
  return errors;
}

/**
 * Custom hook for form validation with Zod
 * Error messages that start with "validation." are automatically translated
 */
export function useFormValidation<T extends Record<string, unknown>>({
  schema,
  initialValues,
  onSubmit,
  translateErrors = true,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const { t } = useTranslation();
  const [values, setValuesState] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Translation function that only translates if the message looks like a key
  const translateMessage = useCallback(
    (message: string): string => {
      if (!translateErrors) return message;
      if (message.startsWith('validation.')) {
        return t(message);
      }
      return message;
    },
    [t, translateErrors]
  );

  const isValid = useMemo(() => {
    const result = schema.safeParse(values);
    return result.success;
  }, [schema, values]);

  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValuesState((prev) => ({ ...prev, [field]: value }));
    // Clear error when value changes
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const touch = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback(
    (field: keyof T): boolean => {
      const fieldValue = values[field];
      // Try to get field schema if it's an object schema
      const schemaAsObject = schema as { shape?: Record<string, z.ZodTypeAny> };
      const fieldSchema = schemaAsObject.shape?.[field as string];

      if (!fieldSchema) {
        // If no field schema found, validate the whole object
        const result = schema.safeParse(values);
        if (!result.success) {
          // Zod 4 uses .issues instead of .errors
          const fieldError = result.error.issues.find((e) => e.path.includes(field as string));
          if (fieldError) {
            setErrors((prev) => ({
              ...prev,
              [field]: translateMessage(fieldError.message),
            }));
            return false;
          }
        }
        return true;
      }

      const result = fieldSchema.safeParse(fieldValue);
      if (!result.success) {
        // Zod 4 uses .issues instead of .errors
        const message = result.error.issues[0]?.message || 'validation.invalid';
        setErrors((prev) => ({
          ...prev,
          [field]: translateMessage(message),
        }));
        return false;
      }

      clearError(field);
      return true;
    },
    [schema, values, clearError, translateMessage]
  );

  const validate = useCallback((): boolean => {
    const result = schema.safeParse(values);
    if (!result.success) {
      setErrors(formatZodErrors(result.error, translateMessage));
      return false;
    }
    setErrors({});
    return true;
  }, [schema, values, translateMessage]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      
      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      for (const key of Object.keys(values)) {
        allTouched[key] = true;
      }
      setTouched(allTouched);

      if (!validate()) {
        return;
      }

      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values as T);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validate, onSubmit]
  );

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: (values[field] ?? '') as string | number | readonly string[],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValue(field, e.target.value);
      },
      onBlur: () => {
        touch(field);
        validateField(field);
      },
      name: field as string,
    }),
    [values, setValue, touch, validateField]
  );

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    touch,
    validate,
    validateField,
    handleSubmit,
    reset,
    getFieldProps,
  };
}

/**
 * Validate a single value against a schema
 */
export function validateValue<T>(schema: ZodSchema<T>, value: unknown): { valid: boolean; error?: string } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { valid: true };
  }
  // Zod 4 uses .issues instead of .errors
  return { valid: false, error: result.error.issues[0]?.message };
}

/**
 * Validate an object against a schema and return formatted errors
 */
export function validateObject<T>(schema: ZodSchema<T>, value: unknown): { valid: boolean; errors: FormErrors; data?: T } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { valid: true, errors: {}, data: result.data };
  }
  return { valid: false, errors: formatZodErrors(result.error) };
}

// Re-export useful types
export { z, type ZodSchema, type ZodError };

