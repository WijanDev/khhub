import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validate, safeParse, getErrorMessages, formatApiErrors } from '../index';

describe('Validation Utilities', () => {
    const schema = z.object({
        email: z.string().email('Invalid email'),
        age: z.number().min(18, 'Must be 18+'),
    });

    describe('validate', () => {
        it('should return success for valid input', () => {
            const input = { email: 'test@example.com', age: 25 };
            const result = validate(schema, input);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(input);
            expect(result.errors).toBeUndefined();
        });

        it('should return error for invalid input', () => {
            const input = { email: 'invalid', age: 10 };
            const result = validate(schema, input);

            expect(result.success).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors?.[0].path).toBe('email');
            expect(result.errors?.[1].path).toBe('age');
        });
    });

    describe('safeParse', () => {
        it('should return data for valid input', () => {
            const input = { email: 'test@example.com', age: 25 };
            const result = safeParse(schema, input);
            expect(result).toEqual(input);
        });

        it('should return null for invalid input', () => {
            const input = { email: 'invalid', age: 10 };
            const result = safeParse(schema, input);
            expect(result).toBeNull();
        });
    });

    describe('getErrorMessages', () => {
        it('should format errors into a record', () => {
            const errors = [
                { path: 'email', message: 'Invalid email' },
                { path: 'age', message: 'Must be 18+' },
            ];
            const messages = getErrorMessages(errors);

            expect(messages).toEqual({
                email: 'Invalid email',
                age: 'Must be 18+',
            });
        });
    });

    describe('formatApiErrors', () => {
        it('should format errors for API response', () => {
            const errors = [
                { path: 'email', message: 'Invalid email' },
                { path: 'age', message: 'Must be 18+' },
            ];
            const response = formatApiErrors(errors);

            expect(response).toEqual({
                error: 'Validation failed',
                details: {
                    email: ['Invalid email'],
                    age: ['Must be 18+'],
                },
            });
        });
    });
});
