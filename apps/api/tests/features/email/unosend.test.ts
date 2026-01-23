import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnosendEmailService } from '@email/infrastructure/adapters/unosend';

describe('UnosendEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  describe('constructor', () => {
    it('should initialize with apiKey and defaultFrom', () => {
      const service = new UnosendEmailService('test-api-key', 'Test <test@example.com>');

      expect(service).toBeDefined();
      expect((service as any).apiKey).toBe('test-api-key');
      expect((service as any).defaultFrom).toBe('Test <test@example.com>');
    });

    it('should use default from email when not provided', () => {
      const service = new UnosendEmailService('test-api-key');

      expect((service as any).defaultFrom).toBe('KH Hub <noreply@khhub.app>');
    });
  });

  describe('sendEmail', () => {
    let service: UnosendEmailService;

    beforeEach(() => {
      service = new UnosendEmailService('test-api-key', 'test@example.com');
    });

    it('should send email with basic options', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'email-123',
          from: 'test@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Subject',
          status: 'queued',
          created_at: '2024-01-01T00:00:00Z',
        }),
      });
      globalThis.fetch = mockFetch;

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toEqual({
        id: 'email-123',
        status: 'queued',
        error: undefined,
      });
      expect(mockFetch).toHaveBeenCalledWith('https://www.unosend.co/api/v1/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'test@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        }),
      });
    });

    it('should send email with custom from address', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        from: 'Custom <custom@example.com>',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"from":"Custom <custom@example.com>"'),
        })
      );
    });

    it('should send email with text content', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"text":"Test Text"'),
        })
      );
    });

    it('should handle array and string recipients', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      await service.sendEmail({
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"to":["recipient1@example.com","recipient2@example.com"]'),
        })
      );
    });

    it('should handle replyTo', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        replyTo: 'reply@example.com',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"reply_to":"reply@example.com"'),
        })
      );
    });

    it('should handle CC recipients as array or string', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        cc: ['cc1@example.com', 'cc2@example.com'],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"cc":["cc1@example.com","cc2@example.com"]'),
        })
      );

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        cc: 'cc@example.com',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"cc":["cc@example.com"]'),
        })
      );
    });

    it('should handle BCC recipients as array or string', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"bcc":["bcc1@example.com","bcc2@example.com"]'),
        })
      );

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        bcc: 'bcc@example.com',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"bcc":["bcc@example.com"]'),
        })
      );
    });

    it('should handle tags as Record', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        tags: { category: 'newsletter', type: 'promotional' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"tags":{"category":"newsletter","type":"promotional"}'),
        })
      );
    });

    it('should not include tags when tags is array', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        tags: ['tag1', 'tag2'],
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody).not.toHaveProperty('tags');
    });

    it('should not include tags when tags is empty object', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        tags: {},
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody).not.toHaveProperty('tags');
    });

    it('should handle custom headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-Another-Header': 'another-value',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"headers":{"X-Custom-Header":"custom-value","X-Another-Header":"another-value"}'),
        })
      );
    });

    it('should handle error response with error object', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email address',
          },
        }),
      });
      globalThis.fetch = mockFetch;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toEqual({
        status: 'failed',
        error: 'Invalid email address',
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle error response with different error formats', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const mockFetch1 = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: { code: 'INVALID_EMAIL' },
        }),
      });
      globalThis.fetch = mockFetch1;

      const result1 = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
      expect(result1).toEqual({ status: 'failed', error: 'Failed to send email' });

      const mockFetch2 = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Custom error message' }),
      });
      globalThis.fetch = mockFetch2;

      const result2 = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
      expect(result2).toEqual({ status: 'failed', error: 'Custom error message' });

      const mockFetch3 = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({}),
      });
      globalThis.fetch = mockFetch3;

      const result3 = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
      expect(result3).toEqual({ status: 'failed', error: 'Failed to send email' });

      consoleErrorSpy.mockRestore();
    });

    it('should handle error response with non-JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
        text: async () => 'Server error',
      });
      globalThis.fetch = mockFetch;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toEqual({
        status: 'failed',
        error: 'Server error',
      });
      consoleErrorSpy.mockRestore();
    });

    it('should handle error response when JSON parsing fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const mockFetch1 = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
        text: async () => 'Server error',
      });
      globalThis.fetch = mockFetch1;

      const result1 = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
      expect(result1).toEqual({ status: 'failed', error: 'Server error' });

      const mockFetch2 = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
        text: async () => '',
      });
      globalThis.fetch = mockFetch2;

      const result2 = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
      expect(result2).toEqual({ status: 'failed', error: 'Failed to send email' });

      const mockFetch3 = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
        text: async () => {
          throw new Error('Cannot read text');
        },
      });
      globalThis.fetch = mockFetch3;

      const result3 = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
      expect(result3).toEqual({ status: 'failed', error: 'Failed to send email' });

      consoleErrorSpy.mockRestore();
    });

    it('should handle network error', async () => {
      const error = new Error('Network error');
      const mockFetch = vi.fn().mockRejectedValue(error);
      globalThis.fetch = mockFetch;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toEqual({
        status: 'failed',
        error: 'Network error',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send email with Unosend:', error);
      consoleErrorSpy.mockRestore();
    });

    it('should handle unknown error format', async () => {
      const error = { code: 500 };
      const mockFetch = vi.fn().mockRejectedValue(error);
      globalThis.fetch = mockFetch;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toEqual({
        status: 'failed',
        error: 'Unknown error',
      });
      consoleErrorSpy.mockRestore();
    });

    it('should use status from response or default to queued', async () => {
      const mockFetch1 = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'sent' }),
      });
      globalThis.fetch = mockFetch1;

      const result1 = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
      expect(result1.status).toBe('sent');

      const mockFetch2 = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123' }),
      });
      globalThis.fetch = mockFetch2;

      const result2 = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
      expect(result2.status).toBe('queued');
    });
  });

  describe('sendSimpleEmail', () => {
    let service: UnosendEmailService;

    beforeEach(() => {
      service = new UnosendEmailService('test-api-key', 'test@example.com');
    });

    it('should send simple email', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123', status: 'queued' }),
      });
      globalThis.fetch = mockFetch;

      const result = await service.sendSimpleEmail(
        'recipient@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test Text'
      );

      expect(result).toEqual({
        id: 'email-123',
        status: 'queued',
        error: undefined,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"to":["recipient@example.com"]'),
        })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.unosend.co/api/v1/emails',
        expect.objectContaining({
          body: expect.stringContaining('"text":"Test Text"'),
        })
      );
    });
  });
});
