import { describe, it, expect } from 'vitest';
import * as Shared from '../index';

describe('Shared Package Exports', () => {
    it('should export validation utilities', () => {
        expect(Shared.validate).toBeDefined();
        expect(Shared.safeParse).toBeDefined();
        expect(Shared.formatApiErrors).toBeDefined();
    });

    it('should export Zod', () => {
        expect(Shared.z).toBeDefined();
        expect(Shared.ZodError).toBeDefined();
    });
});
