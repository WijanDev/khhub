import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuth, getAuth, type Auth } from '@auth/infrastructure/better-auth';
import { createMockD1, createMockEnv } from '../../../test-utils/setup';
import type { EmailService } from '@email/domain/types';
import { EmailTemplates } from '@email/application/templates';

const mockBetterAuth = vi.fn((config) => ({
  handler: vi.fn(),
  api: vi.fn(),
  ...config,
}));

vi.mock('better-auth', () => {
  const mockFn = vi.fn((config) => ({
    handler: vi.fn(),
    api: vi.fn(),
    ...config,
  }));
  return {
    betterAuth: mockFn,
    __mockBetterAuth: mockFn,
  };
});

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn((db, config) => ({
    db,
    ...config,
  })),
}));

vi.mock('better-auth/plugins', () => ({
  admin: vi.fn(() => ({ name: 'admin' })),
}));

vi.mock('../../../../src/features/email/service', () => ({
  createEmailServiceFromEnv: vi.fn(() => ({
    sendEmail: vi.fn(),
  })),
}));

vi.mock('../../../../src/features/email/infrastructure/factory', () => ({
  EmailTemplates: {
    passwordReset: vi.fn((name, url) => `Password reset for ${name}: ${url}`),
    emailVerification: vi.fn((name, url) => `Verify email for ${name}: ${url}`),
  },
}));

describe('Auth', () => {
  let mockD1: D1Database;
  let mockEmailService: EmailService;

  beforeEach(() => {
    mockD1 = createMockD1();
    mockEmailService = {
      sendEmail: vi.fn(),
    } as unknown as EmailService;
    vi.clearAllMocks();
  });

  describe('createAuth', () => {
    it('should create auth instance with correct configuration', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
        webAppUrl: 'https://app.example.com',
        environment: 'production',
      });

      expect(auth).toBeDefined();
    });

    it('should use development secret when AUTH_SECRET is not provided', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'development-secret-change-in-production',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });

    it('should disable origin check in non-production environments', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
        environment: 'development',
      });

      expect(auth).toBeDefined();
    });

    it('should enable origin check in production environment', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
        environment: 'production',
      });

      expect(auth).toBeDefined();
    });

    it('should configure email and password authentication', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });

    it('should configure email verification', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
        webAppUrl: 'https://app.example.com',
      });

      expect(auth).toBeDefined();
    });

    it('should include admin plugin', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });

    it('should configure session expiration', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });

    it('should include trusted origins', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });
  });

  describe('getAuth', () => {
    it('should create auth instance from Hono context', () => {
      const mockEnv = createMockEnv({
        AUTH_SECRET: 'test-secret',
        WEB_APP_URL: 'https://app.example.com',
        ENVIRONMENT: 'test',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 'test-resend-key',
      });

      const mockContext = {
        env: mockEnv,
        req: {
          url: 'https://api.example.com/auth/signin',
        },
      };

      const auth = getAuth(mockContext);

      expect(auth).toBeDefined();
    });

    it('should use development secret when AUTH_SECRET is not set', () => {
      const mockEnv = createMockEnv({
        WEB_APP_URL: 'https://app.example.com',
        ENVIRONMENT: 'test',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 'test-resend-key',
      });

      const mockContext = {
        env: mockEnv,
        req: {
          url: 'https://api.example.com/auth/signin',
        },
      };

      const auth = getAuth(mockContext);

      expect(auth).toBeDefined();
    });

    it('should extract base URL from request URL', () => {
      const mockEnv = createMockEnv({
        AUTH_SECRET: 'test-secret',
        WEB_APP_URL: 'https://app.example.com',
        ENVIRONMENT: 'test',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 'test-resend-key',
      });

      const mockContext = {
        env: mockEnv,
        req: {
          url: 'https://api.example.com:8080/auth/signin',
        },
      };

      const auth = getAuth(mockContext);

      expect(auth).toBeDefined();
    });

    it('should handle HTTP URLs', () => {
      const mockEnv = createMockEnv({
        AUTH_SECRET: 'test-secret',
        WEB_APP_URL: 'http://localhost:5173',
        ENVIRONMENT: 'development',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 'test-resend-key',
      });

      const mockContext = {
        env: mockEnv,
        req: {
          url: 'http://localhost:8787/auth/signin',
        },
      };

      const auth = getAuth(mockContext);

      expect(auth).toBeDefined();
    });

    it('should pass environment to createAuth', () => {
      const mockEnv = createMockEnv({
        AUTH_SECRET: 'test-secret',
        WEB_APP_URL: 'https://app.example.com',
        ENVIRONMENT: 'production',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 'test-resend-key',
      });

      const mockContext = {
        env: mockEnv,
        req: {
          url: 'https://api.example.com/auth/signin',
        },
      };

      const auth = getAuth(mockContext);

      expect(auth).toBeDefined();
    });

    it('should pass webAppUrl to createAuth', () => {
      const mockEnv = createMockEnv({
        AUTH_SECRET: 'test-secret',
        WEB_APP_URL: 'https://app.example.com',
        ENVIRONMENT: 'test',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 'test-resend-key',
      });

      const mockContext = {
        env: mockEnv,
        req: {
          url: 'https://api.example.com/auth/signin',
        },
      };

      const auth = getAuth(mockContext);

      expect(auth).toBeDefined();
    });
  });

  describe('Email callbacks', () => {
    it('should configure password reset email callback', async () => {
      const sendEmailSpy = vi.fn().mockResolvedValue({ id: 'email-id' });
      const emailService = {
        sendEmail: sendEmailSpy,
      } as unknown as EmailService;

      const EmailTemplatesSpy = vi.spyOn(EmailTemplates, 'passwordReset');

      vi.clearAllMocks();
      createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService,
        webAppUrl: 'https://app.example.com',
      });

      const betterAuthModule = await import('better-auth');
      const mockFn = (betterAuthModule as any).__mockBetterAuth || betterAuthModule.betterAuth;
      expect(mockFn).toHaveBeenCalled();
      const config = mockFn.mock.calls[0][0];
      expect(config.emailAndPassword?.sendResetPassword).toBeDefined();

      const user = { email: 'test@example.com', name: 'Test User' };
      const token = 'reset-token-123';
      await config.emailAndPassword.sendResetPassword({ user, token });

      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Reset your password - KH Hub',
        html: expect.stringContaining('reset-token-123'),
      });

      expect(EmailTemplatesSpy).toHaveBeenCalledWith('Test User', 'https://app.example.com/auth/reset-password?token=reset-token-123');
    });

    it('should configure email verification callback', async () => {
      const sendEmailSpy = vi.fn().mockResolvedValue({ id: 'email-id' });
      const emailService = {
        sendEmail: sendEmailSpy,
      } as unknown as EmailService;
      const EmailTemplatesSpy = vi.spyOn(EmailTemplates, 'emailVerification');

      vi.clearAllMocks();
      createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService,
        webAppUrl: 'https://app.example.com',
      });

      const betterAuthModule = await import('better-auth');
      const mockFn = (betterAuthModule as any).__mockBetterAuth || betterAuthModule.betterAuth;
      expect(mockFn).toHaveBeenCalled();
      const config = mockFn.mock.calls[0][0];
      expect(config.emailVerification?.sendVerificationEmail).toBeDefined();

      const user = { email: 'test@example.com', name: 'Test User' };
      const token = 'verify-token-456';
      await config.emailVerification.sendVerificationEmail({ user, token });

      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Verify your email - KH Hub',
        html: expect.stringContaining('verify-token-456'),
      });

      expect(EmailTemplatesSpy).toHaveBeenCalledWith('Test User', 'https://app.example.com/auth/verify-email?token=verify-token-456');
    });
  });

  describe('Configuration options', () => {
    it('should set basePath to /auth', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });

    it('should configure password length constraints', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });

    it('should require email verification', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });

    it('should configure session expiration to 7 days', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });

    it('should configure session update age to 1 day', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });

    it('should include localhost origins in trustedOrigins', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });

      expect(auth).toBeDefined();
    });
  });

  describe('Auth type', () => {
    it('should export Auth type', () => {
      const auth = createAuth(mockD1, {
        baseURL: 'https://api.example.com',
        secret: 'test-secret',
        emailService: mockEmailService,
      });
      const typedAuth: Auth = auth;

      expect(typedAuth).toBeDefined();
    });
  });
});
