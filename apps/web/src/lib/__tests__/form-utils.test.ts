import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { getFieldError, hasFieldError, zodValidator, zodFieldValidator } from '../form-utils';

describe('getFieldError', () => {
  const mockT = vi.fn((key: string) => `translated:${key}`);

  beforeEach(() => {
    mockT.mockClear();
  });

  it('should return null for empty errors array', () => {
    const result = getFieldError([], mockT);
    expect(result).toBeNull();
    expect(mockT).not.toHaveBeenCalled();
  });

  it('should return null for null errors', () => {
    const result = getFieldError(null as any, mockT);
    expect(result).toBeNull();
    expect(mockT).not.toHaveBeenCalled();
  });

  it('should extract and translate string error', () => {
    const errors = ['validation.required'];
    const result = getFieldError(errors, mockT);
    
    expect(result).toBe('translated:validation.required');
    expect(mockT).toHaveBeenCalledWith('validation.required');
  });

  it('should extract and translate ZodError', () => {
    const schema = z.string().min(5, 'validation.minLength');
    const result = schema.safeParse('abc');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = [result.error];
      const translated = getFieldError(errors, mockT);
      
      expect(translated).toBe('translated:validation.minLength');
      expect(mockT).toHaveBeenCalledWith('validation.minLength');
    }
  });

  it('should return null when ZodError has empty issues array', () => {
    // Create a ZodError with empty issues array
    const zodError = new z.ZodError([]);
    const errors = [zodError];
    const result = getFieldError(errors, mockT);
    
    expect(result).toBeNull();
    expect(mockT).not.toHaveBeenCalled();
  });

  it('should return null when ZodError first issue has no message', () => {
    // Create a ZodError with an issue that has no message
    const zodError = new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: [],
      } as z.ZodIssue,
    ]);
    const errors = [zodError];
    const result = getFieldError(errors, mockT);
    
    expect(result).toBeNull();
    expect(mockT).not.toHaveBeenCalled();
  });

  it('should extract message from error object with message property', () => {
    const errors = [{ message: 'validation.invalid' }];
    const result = getFieldError(errors, mockT);
    
    expect(result).toBe('translated:validation.invalid');
    expect(mockT).toHaveBeenCalledWith('validation.invalid');
  });

  it('should extract message from error object with issues array', () => {
    const errors = [{
      issues: [
        { message: 'validation.required' },
        { message: 'validation.format' },
      ],
    }];
    const result = getFieldError(errors, mockT);
    
    expect(result).toBe('translated:validation.required');
    expect(mockT).toHaveBeenCalledWith('validation.required');
  });

  it('should handle error object with empty issues array', () => {
    const errors = [{ issues: [] }];
    const result = getFieldError(errors, mockT);
    
    expect(result).toBeNull();
    expect(mockT).not.toHaveBeenCalled();
  });

  it('should handle error object with issues but no message', () => {
    const errors = [{ issues: [{}] }];
    const result = getFieldError(errors, mockT);
    
    expect(result).toBeNull();
    expect(mockT).not.toHaveBeenCalled();
  });

  it('should convert non-object error to string if meaningful', () => {
    const errors = [123];
    const result = getFieldError(errors, mockT);
    
    expect(result).toBe('translated:123');
    expect(mockT).toHaveBeenCalledWith('123');
  });

  it('should return null for empty object error', () => {
    const errors = [{}];
    const result = getFieldError(errors, mockT);
    
    expect(result).toBeNull();
    expect(mockT).not.toHaveBeenCalled();
  });

  it('should use first error when multiple errors exist', () => {
    const errors = ['validation.first', 'validation.second'];
    const result = getFieldError(errors, mockT);
    
    expect(result).toBe('translated:validation.first');
    expect(mockT).toHaveBeenCalledWith('validation.first');
    expect(mockT).toHaveBeenCalledTimes(1);
  });
});

describe('hasFieldError', () => {
  it('should return false when field is not blurred', () => {
    expect(hasFieldError(false, ['error'])).toBe(false);
  });

  it('should return false when errors array is empty', () => {
    expect(hasFieldError(true, [])).toBe(false);
  });

  it('should return false when errors is null', () => {
    // When errors is null, the check `errors && errors.length > 0` evaluates to null/falsy
    const result = hasFieldError(true, null as any);
    expect(result).toBeFalsy();
  });

  it('should return false when errors is undefined', () => {
    // When errors is undefined, the check `errors && errors.length > 0` evaluates to undefined/falsy
    const result = hasFieldError(true, undefined as any);
    expect(result).toBeFalsy();
  });

  it('should return true when field is blurred and has errors', () => {
    expect(hasFieldError(true, ['error'])).toBe(true);
  });

  it('should return true when field is blurred and has multiple errors', () => {
    expect(hasFieldError(true, ['error1', 'error2'])).toBe(true);
  });

  it('should return false when field is not blurred even with errors', () => {
    expect(hasFieldError(false, ['error'])).toBe(false);
  });

  it('should return false when field is blurred but no errors', () => {
    expect(hasFieldError(true, [])).toBe(false);
  });
});

describe('zodValidator', () => {
  it('should return undefined for valid value', () => {
    const schema = z.string().min(3);
    const validator = zodValidator(schema);
    
    const result = validator({ value: 'valid' });
    expect(result).toBeUndefined();
  });

  it('should return field errors map for invalid value', () => {
    const schema = z.object({
      name: z.string().min(3, 'validation.name.minLength'),
      email: z.string().email('validation.email.invalid'),
    });
    const validator = zodValidator(schema);
    
    const result = validator({ value: { name: 'ab', email: 'invalid' } });
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('name', 'validation.name.minLength');
    expect(result).toHaveProperty('email', 'validation.email.invalid');
  });

  it('should handle nested field paths', () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(3, 'validation.name.minLength'),
      }),
    });
    const validator = zodValidator(schema);
    
    const result = validator({ value: { user: { name: 'ab' } } });
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('user.name', 'validation.name.minLength');
  });

  it('should use _root for root-level errors', () => {
    const schema = z.string().min(5, 'validation.minLength');
    const validator = zodValidator(schema);
    
    const result = validator({ value: 'abc' });
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('_root', 'validation.minLength');
  });

  it('should only include first error per field path', () => {
    const schema = z.object({
      email: z.string().email('validation.email.invalid').refine(
        (val) => val.endsWith('@example.com'),
        'validation.email.domain'
      ),
    });
    const validator = zodValidator(schema);
    
    const result = validator({ value: { email: 'not-an-email' } });
    
    expect(result).toBeDefined();
    // Should only have one error for email field
    expect(result).toHaveProperty('email');
    expect(Object.keys(result!).filter(k => k.startsWith('email')).length).toBe(1);
  });

  it('should handle array field paths', () => {
    const schema = z.object({
      items: z.array(z.string().min(3, 'validation.item.minLength')),
    });
    const validator = zodValidator(schema);
    
    const result = validator({ value: { items: ['ab'] } });
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty('items.0', 'validation.item.minLength');
  });

  it('should return undefined for valid nested object', () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(3),
        email: z.string().email(),
      }),
    });
    const validator = zodValidator(schema);
    
    const result = validator({
      value: { user: { name: 'John', email: 'john@example.com' } },
    });
    
    expect(result).toBeUndefined();
  });
});

describe('zodFieldValidator', () => {
  it('should return undefined for valid value', () => {
    const schema = z.string().min(3);
    const validator = zodFieldValidator(schema);
    
    const result = validator({ value: 'valid' });
    expect(result).toBeUndefined();
  });

  it('should return first error message for invalid value', () => {
    const schema = z.string().min(5, 'validation.minLength');
    const validator = zodFieldValidator(schema);
    
    const result = validator({ value: 'abc' });
    expect(result).toBe('validation.minLength');
  });

  it('should return first error message when multiple errors exist', () => {
    const schema = z.string()
      .min(5, 'validation.minLength')
      .email('validation.email.invalid');
    const validator = zodFieldValidator(schema);
    
    const result = validator({ value: 'ab' });
    expect(result).toBe('validation.minLength');
  });

  it('should return undefined for valid object', () => {
    const schema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
    });
    const validator = zodFieldValidator(schema);
    
    const result = validator({
      value: { name: 'John', email: 'john@example.com' },
    });
    expect(result).toBeUndefined();
  });

  it('should return first error message for invalid object', () => {
    const schema = z.object({
      name: z.string().min(3, 'validation.name.minLength'),
      email: z.string().email('validation.email.invalid'),
    });
    const validator = zodFieldValidator(schema);
    
    const result = validator({ value: { name: 'ab', email: 'invalid' } });
    expect(result).toBe('validation.name.minLength');
  });

  it('should handle custom error messages', () => {
    const schema = z.number().min(18, 'validation.age.minimum');
    const validator = zodFieldValidator(schema);
    
    const result = validator({ value: 15 });
    expect(result).toBe('validation.age.minimum');
  });

  it('should return undefined for valid number', () => {
    const schema = z.number().min(18);
    const validator = zodFieldValidator(schema);
    
    const result = validator({ value: 25 });
    expect(result).toBeUndefined();
  });

  it('should handle empty string validation', () => {
    const schema = z.string().min(1, 'validation.required');
    const validator = zodFieldValidator(schema);
    
    const result = validator({ value: '' });
    expect(result).toBe('validation.required');
  });

  it('should handle undefined value', () => {
    const schema = z.string().min(1, 'validation.required');
    const validator = zodFieldValidator(schema);
    
    const result = validator({ value: undefined as any });
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
