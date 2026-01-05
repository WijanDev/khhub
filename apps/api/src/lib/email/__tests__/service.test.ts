import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEmailServiceFromEnv } from '../service';
import type { Env } from '../../../types';

const mockEmailService = {
  sendEmail: vi.fn(),
  sendSimpleEmail: vi.fn(),
};

vi.mock('../index', () => ({
  createEmailService: vi.fn(() => mockEmailService),
}));

describe('createEmailServiceFromEnv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resend provider', () => {
    it('should create resend service with API key', async () => {
      const { createEmailService } = await import('../index');
      const env: Env = {
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 'test-resend-key',
        DB: {} as D1Database,
        CACHE: {} as KVNamespace,
        STORAGE: {} as R2Bucket,
      };

      const service = createEmailServiceFromEnv(env);

      expect(service).toBe(mockEmailService);
      expect(createEmailService).toHaveBeenCalledWith('resend', {
        resendApiKey: 'test-resend-key',
      });
    });

    it('should default to resend when EMAIL_PROVIDER is not set', async () => {
      const { createEmailService } = await import('../index');
      const env: Env = {
        RESEND_API_KEY: 'test-resend-key',
        DB: {} as D1Database,
        CACHE: {} as KVNamespace,
        STORAGE: {} as R2Bucket,
      };

      const service = createEmailServiceFromEnv(env);

      expect(service).toBe(mockEmailService);
      expect(createEmailService).toHaveBeenCalledWith('resend', {
        resendApiKey: 'test-resend-key',
      });
    });

    it('should throw error when RESEND_API_KEY is missing', () => {
      const env: Env = {
        EMAIL_PROVIDER: 'resend',
        DB: {} as D1Database,
        CACHE: {} as KVNamespace,
        STORAGE: {} as R2Bucket,
      };

      expect(() => {
        createEmailServiceFromEnv(env);
      }).toThrow('RESEND_API_KEY is required when EMAIL_PROVIDER is resend');
    });
  });

  describe('mailgun provider', () => {
    it('should create mailgun service with API key and domain', async () => {
      const { createEmailService } = await import('../index');
      const env: Env = {
        EMAIL_PROVIDER: 'mailgun',
        MAILGUN_API_KEY: 'test-mailgun-key',
        MAILGUN_DOMAIN: 'test-domain.com',
        DB: {} as D1Database,
        CACHE: {} as KVNamespace,
        STORAGE: {} as R2Bucket,
      };

      const service = createEmailServiceFromEnv(env);

      expect(service).toBe(mockEmailService);
      expect(createEmailService).toHaveBeenCalledWith('mailgun', {
        mailgunApiKey: 'test-mailgun-key',
        mailgunDomain: 'test-domain.com',
      });
    });

    it('should throw error when MAILGUN_API_KEY is missing', () => {
      const env: Env = {
        EMAIL_PROVIDER: 'mailgun',
        MAILGUN_DOMAIN: 'test-domain.com',
        DB: {} as D1Database,
        CACHE: {} as KVNamespace,
        STORAGE: {} as R2Bucket,
      };

      expect(() => {
        createEmailServiceFromEnv(env);
      }).toThrow('MAILGUN_API_KEY and MAILGUN_DOMAIN are required when EMAIL_PROVIDER is mailgun');
    });

    it('should throw error when MAILGUN_DOMAIN is missing', () => {
      const env: Env = {
        EMAIL_PROVIDER: 'mailgun',
        MAILGUN_API_KEY: 'test-mailgun-key',
        DB: {} as D1Database,
        CACHE: {} as KVNamespace,
        STORAGE: {} as R2Bucket,
      };

      expect(() => {
        createEmailServiceFromEnv(env);
      }).toThrow('MAILGUN_API_KEY and MAILGUN_DOMAIN are required when EMAIL_PROVIDER is mailgun');
    });

    it('should throw error when both MAILGUN_API_KEY and MAILGUN_DOMAIN are missing', () => {
      const env: Env = {
        EMAIL_PROVIDER: 'mailgun',
        DB: {} as D1Database,
        CACHE: {} as KVNamespace,
        STORAGE: {} as R2Bucket,
      };

      expect(() => {
        createEmailServiceFromEnv(env);
      }).toThrow('MAILGUN_API_KEY and MAILGUN_DOMAIN are required when EMAIL_PROVIDER is mailgun');
    });
  });

  describe('unosend provider', () => {
    it('should create unosend service with API key', async () => {
      const { createEmailService } = await import('../index');
      const env: Env = {
        EMAIL_PROVIDER: 'unosend',
        UNOSEND_API_KEY: 'test-unosend-key',
        DB: {} as D1Database,
        CACHE: {} as KVNamespace,
        STORAGE: {} as R2Bucket,
      };

      const service = createEmailServiceFromEnv(env);

      expect(service).toBe(mockEmailService);
      expect(createEmailService).toHaveBeenCalledWith('unosend', {
        unosendApiKey: 'test-unosend-key',
      });
    });

    it('should throw error when UNOSEND_API_KEY is missing', () => {
      const env: Env = {
        EMAIL_PROVIDER: 'unosend',
        DB: {} as D1Database,
        CACHE: {} as KVNamespace,
        STORAGE: {} as R2Bucket,
      };

      expect(() => {
        createEmailServiceFromEnv(env);
      }).toThrow('UNOSEND_API_KEY is required when EMAIL_PROVIDER is unosend');
    });
  });

  describe('unknown provider', () => {
    it('should throw error for unknown provider', () => {
      const env: Env = {
        EMAIL_PROVIDER: 'unknown' as any,
        DB: {} as D1Database,
        CACHE: {} as KVNamespace,
        STORAGE: {} as R2Bucket,
      };

      expect(() => {
        createEmailServiceFromEnv(env);
      }).toThrow("Unknown email provider: unknown. Must be 'unosend', 'mailgun', or 'resend'");
    });
  });
});
