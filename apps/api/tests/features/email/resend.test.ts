import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResendEmailService } from '@email/infrastructure/adapters/resend';

vi.mock('resend', () => {
  const mockEmailsSend = vi.fn();

  class MockResend {
    emails = {
      send: mockEmailsSend,
    };
  }

  return {
    Resend: MockResend,
    __mockEmailsSend: mockEmailsSend,
  };
});

describe('ResendEmailService', () => {
  let mockEmailsSend: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const resendModule = await import('resend');
    mockEmailsSend = (resendModule as any).__mockEmailsSend;
  });

  describe('sendEmail', () => {
    let service: ResendEmailService;

    beforeEach(async () => {
      service = new ResendEmailService('test-api-key', 'test@example.com');
      const resendModule = await import('resend');
      mockEmailsSend = (resendModule as any).__mockEmailsSend;
      mockEmailsSend.mockClear();
    });

    it('should send email with basic options', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toEqual({
        id: 'email-123',
        status: 'sent',
        error: undefined,
      });
      expect(mockEmailsSend).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
    });

    it('should send email with custom from address', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        from: 'Custom <custom@example.com>',
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        from: 'Custom <custom@example.com>',
      }));
    });

    it('should send email with text content', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Test Text',
      }));
    });

    it('should handle array of recipients', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        to: ['recipient1@example.com', 'recipient2@example.com'],
      }));
    });

    it('should handle single string recipient', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        to: ['recipient@example.com'],
      }));
    });

    it('should handle replyTo', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        replyTo: 'reply@example.com',
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        replyTo: 'reply@example.com',
      }));
    });

    it('should handle CC recipients as array', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        cc: ['cc1@example.com', 'cc2@example.com'],
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        cc: ['cc1@example.com', 'cc2@example.com'],
      }));
    });

    it('should handle CC recipient as string', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        cc: 'cc@example.com',
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        cc: ['cc@example.com'],
      }));
    });

    it('should handle BCC recipients as array', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      }));
    });

    it('should handle BCC recipient as string', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        bcc: 'bcc@example.com',
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        bcc: ['bcc@example.com'],
      }));
    });

    it('should handle tags as array when headers not provided', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        tags: ['tag1', 'tag2'],
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        headers: {
          'X-Tag-tag1': 'true',
          'X-Tag-tag2': 'true',
        },
      }));
    });

    it('should handle tags as Record when headers not provided', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        tags: { category: 'newsletter', type: 'promotional' },
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        headers: {
          'X-Tag-category': 'newsletter',
          'X-Tag-type': 'promotional',
        },
      }));
    });

    it('should not convert tags to headers when headers are provided', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        tags: ['tag1', 'tag2'],
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      }));
      expect(mockEmailsSend).toHaveBeenCalledWith(expect.not.objectContaining({
        'X-Tag-tag1': 'true',
      }));
    });

    it('should handle custom headers', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-Another-Header': 'another-value',
        },
      });

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-Another-Header': 'another-value',
        },
      }));
    });

    it('should handle error from Resend API', async () => {
      const error = { message: 'Resend API error' };
      mockEmailsSend.mockResolvedValue({ data: null, error });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toEqual({
        status: 'failed',
        error: 'Resend API error',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send email with Resend:', error);
      consoleErrorSpy.mockRestore();
    });

    it('should handle error without message property', async () => {
      const error = { code: 500 };
      mockEmailsSend.mockResolvedValue({ data: null, error });
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

    it('should handle exception from Resend API', async () => {
      const error = new Error('Network error');
      mockEmailsSend.mockRejectedValue(error);
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
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send email with Resend:', error);
      consoleErrorSpy.mockRestore();
    });

    it('should handle exception with message property', async () => {
      const error = { message: 'Custom error message' };
      mockEmailsSend.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toEqual({
        status: 'failed',
        error: 'Custom error message',
      });
      consoleErrorSpy.mockRestore();
    });

    it('should handle unknown exception format', async () => {
      const error = { code: 500 };
      mockEmailsSend.mockRejectedValue(error);
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
  });

  describe('sendSimpleEmail', () => {
    let service: ResendEmailService;

    beforeEach(async () => {
      service = new ResendEmailService('test-api-key', 'test@example.com');
      const resendModule = await import('resend');
      mockEmailsSend = (resendModule as any).__mockEmailsSend;
      mockEmailsSend.mockClear();
    });

    it('should send simple email with required parameters', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      const result = await service.sendSimpleEmail(
        'recipient@example.com',
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(result).toEqual({
        id: 'email-123',
        status: 'sent',
        error: undefined,
      });
      expect(mockEmailsSend).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
    });

    it('should send simple email with text content', async () => {
      mockEmailsSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });

      await service.sendSimpleEmail(
        'recipient@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test Text'
      );

      expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Test Text',
      }));
    });
  });
});
