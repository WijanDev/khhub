import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEmailService,
  UnosendEmailService,
  MailgunEmailService,
  ResendEmailService,
  EmailTemplates,
} from '../index';
import type { EmailService } from '../types';

vi.mock('../unosend', () => ({
  UnosendEmailService: class {
    apiKey: string;
    defaultFrom: string;
    sendEmail = vi.fn();
    sendSimpleEmail = vi.fn();
    constructor(apiKey: string, defaultFrom: string) {
      this.apiKey = apiKey;
      this.defaultFrom = defaultFrom;
    }
  },
}));

vi.mock('../mailgun', () => ({
  MailgunEmailService: class {
    apiKey: string;
    domain: string;
    defaultFrom: string;
    sendEmail = vi.fn();
    sendSimpleEmail = vi.fn();
    constructor(apiKey: string, domain: string, defaultFrom: string) {
      this.apiKey = apiKey;
      this.domain = domain;
      this.defaultFrom = defaultFrom;
    }
  },
}));

vi.mock('../resend', () => ({
  ResendEmailService: class {
    apiKey: string;
    defaultFrom: string;
    sendEmail = vi.fn();
    sendSimpleEmail = vi.fn();
    constructor(apiKey: string, defaultFrom: string) {
      this.apiKey = apiKey;
      this.defaultFrom = defaultFrom;
    }
  },
}));

describe('createEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unosend provider', () => {
    it('should create UnosendEmailService with API key', () => {
      const service = createEmailService('unosend', {
        unosendApiKey: 'test-api-key',
      });

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(UnosendEmailService);
      expect((service as any).apiKey).toBe('test-api-key');
      expect((service as any).defaultFrom).toBe('KH Hub <noreply@khhub.app>');
      expect(service).toHaveProperty('sendEmail');
      expect(service).toHaveProperty('sendSimpleEmail');
    });

    it('should create UnosendEmailService with custom defaultFrom', () => {
      const service = createEmailService('unosend', {
        unosendApiKey: 'test-api-key',
        defaultFrom: 'Custom <custom@example.com>',
      });

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(UnosendEmailService);
      expect((service as any).apiKey).toBe('test-api-key');
      expect((service as any).defaultFrom).toBe('Custom <custom@example.com>');
    });

    it('should throw error when unosendApiKey is missing', () => {
      expect(() => {
        createEmailService('unosend', {});
      }).toThrow('UNOSEND_API_KEY is required for Unosend provider');
    });

    it('should throw error when unosendApiKey is empty string', () => {
      expect(() => {
        createEmailService('unosend', {
          unosendApiKey: '',
        });
      }).toThrow('UNOSEND_API_KEY is required for Unosend provider');
    });
  });

  describe('mailgun provider', () => {
    it('should create MailgunEmailService with API key and domain', () => {
      const service = createEmailService('mailgun', {
        mailgunApiKey: 'test-api-key',
        mailgunDomain: 'test-domain.com',
      });

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(MailgunEmailService);
      expect((service as any).apiKey).toBe('test-api-key');
      expect((service as any).domain).toBe('test-domain.com');
      expect((service as any).defaultFrom).toBe('KH Hub <noreply@khhub.app>');
      expect(service).toHaveProperty('sendEmail');
      expect(service).toHaveProperty('sendSimpleEmail');
    });

    it('should create MailgunEmailService with custom defaultFrom', () => {
      const service = createEmailService('mailgun', {
        mailgunApiKey: 'test-api-key',
        mailgunDomain: 'test-domain.com',
        defaultFrom: 'Custom <custom@example.com>',
      });

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(MailgunEmailService);
      expect((service as any).apiKey).toBe('test-api-key');
      expect((service as any).domain).toBe('test-domain.com');
      expect((service as any).defaultFrom).toBe('Custom <custom@example.com>');
    });

    it('should throw error when mailgunApiKey is missing', () => {
      expect(() => {
        createEmailService('mailgun', {
          mailgunDomain: 'test-domain.com',
        });
      }).toThrow('MAILGUN_API_KEY and MAILGUN_DOMAIN are required for Mailgun provider');
    });

    it('should throw error when mailgunDomain is missing', () => {
      expect(() => {
        createEmailService('mailgun', {
          mailgunApiKey: 'test-api-key',
        });
      }).toThrow('MAILGUN_API_KEY and MAILGUN_DOMAIN are required for Mailgun provider');
    });

    it('should throw error when both mailgunApiKey and mailgunDomain are missing', () => {
      expect(() => {
        createEmailService('mailgun', {});
      }).toThrow('MAILGUN_API_KEY and MAILGUN_DOMAIN are required for Mailgun provider');
    });
  });

  describe('resend provider', () => {
    it('should create ResendEmailService with API key', () => {
      const service = createEmailService('resend', {
        resendApiKey: 'test-api-key',
      });

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ResendEmailService);
      expect((service as any).apiKey).toBe('test-api-key');
      expect((service as any).defaultFrom).toBe('KH Hub <noreply@khhub.app>');
      expect(service).toHaveProperty('sendEmail');
      expect(service).toHaveProperty('sendSimpleEmail');
    });

    it('should create ResendEmailService with custom defaultFrom', () => {
      const service = createEmailService('resend', {
        resendApiKey: 'test-api-key',
        defaultFrom: 'Custom <custom@example.com>',
      });

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ResendEmailService);
      expect((service as any).apiKey).toBe('test-api-key');
      expect((service as any).defaultFrom).toBe('Custom <custom@example.com>');
    });

    it('should throw error when resendApiKey is missing', () => {
      expect(() => {
        createEmailService('resend', {});
      }).toThrow('RESEND_API_KEY is required for Resend provider');
    });

    it('should throw error when resendApiKey is empty string', () => {
      expect(() => {
        createEmailService('resend', {
          resendApiKey: '',
        });
      }).toThrow('RESEND_API_KEY is required for Resend provider');
    });
  });

  describe('unknown provider', () => {
    it('should throw error for unknown provider', () => {
      expect(() => {
        createEmailService('unknown' as any, {});
      }).toThrow("Unknown email provider: unknown. Must be 'unosend', 'mailgun', or 'resend'");
    });
  });

  describe('default from email', () => {
    it('should use default from email when not provided', () => {
      const service = createEmailService('unosend', {
        unosendApiKey: 'test-api-key',
      });

      expect((service as any).defaultFrom).toBe('KH Hub <noreply@khhub.app>');
    });

    it('should use custom default from email when provided', () => {
      const service = createEmailService('unosend', {
        unosendApiKey: 'test-api-key',
        defaultFrom: 'Custom Sender <sender@example.com>',
      });

      expect((service as any).defaultFrom).toBe('Custom Sender <sender@example.com>');
    });
  });

  describe('service interface', () => {
    it('should return service implementing EmailService interface', () => {
      const service = createEmailService('unosend', {
        unosendApiKey: 'test-api-key',
      });

      expect(service).toHaveProperty('sendEmail');
      expect(service).toHaveProperty('sendSimpleEmail');
      expect(typeof service.sendEmail).toBe('function');
      expect(typeof service.sendSimpleEmail).toBe('function');
    });
  });
});

describe('exports', () => {
  it('should export EmailTemplates', () => {
    expect(EmailTemplates).toBeDefined();
  });

  it('should export UnosendEmailService class', () => {
    expect(UnosendEmailService).toBeDefined();
  });

  it('should export MailgunEmailService class', () => {
    expect(MailgunEmailService).toBeDefined();
  });

  it('should export ResendEmailService class', () => {
    expect(ResendEmailService).toBeDefined();
  });
});
