import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MailgunEmailService } from '../mailgun';

vi.mock('mailgun.js', () => {
  const mockMessagesCreate = vi.fn();
  const mockClient = vi.fn(() => ({
    messages: {
      create: mockMessagesCreate,
    },
  }));

  class MockMailgun {
    client = mockClient;
  }

  return {
    default: MockMailgun,
    __mockMessagesCreate: mockMessagesCreate,
    __mockClient: mockClient,
  };
});

describe('MailgunEmailService', () => {
  let mockMessagesCreate: ReturnType<typeof vi.fn>;
  let mockClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mailgunModule = await import('mailgun.js');
    mockMessagesCreate = (mailgunModule as any).__mockMessagesCreate;
    mockClient = (mailgunModule as any).__mockClient;
  });

  describe('constructor', () => {
    it('should initialize with domain and defaultFrom', () => {
      const service = new MailgunEmailService('test-api-key', 'test-domain.com', 'Test <test@example.com>');

      expect(service).toBeDefined();
      expect((service as any).domain).toBe('test-domain.com');
      expect((service as any).defaultFrom).toBe('Test <test@example.com>');
      expect(mockClient).toHaveBeenCalledWith({
        username: 'api',
        key: 'test-api-key',
        url: 'https://api.mailgun.net',
      });
    });

    it('should use default from email when not provided', () => {
      const service = new MailgunEmailService('test-api-key', 'test-domain.com');

      expect((service as any).defaultFrom).toBe('KH Hub <noreply@khhub.app>');
    });
  });

  describe('sendEmail', () => {
    let service: MailgunEmailService;

    beforeEach(async () => {
      service = new MailgunEmailService('test-api-key', 'test-domain.com');
      const mailgunModule = await import('mailgun.js');
      mockMessagesCreate = (mailgunModule as any).__mockMessagesCreate;
      mockMessagesCreate.mockClear();
    });

    it('should send email with basic options', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toEqual({
        id: 'msg-123',
        status: 'queued',
        error: undefined,
      });
      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', {
        from: 'KH Hub <noreply@khhub.app>',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
    });

    it('should send email with custom from address', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        from: 'Custom <custom@example.com>',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        from: 'Custom <custom@example.com>',
      }));
    });

    it('should send email with text content', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        text: 'Test Text',
      }));
    });

    it('should handle array of recipients', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        to: ['recipient1@example.com', 'recipient2@example.com'],
      }));
    });

    it('should handle single string recipient', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        to: ['recipient@example.com'],
      }));
    });

    it('should handle replyTo', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        replyTo: 'reply@example.com',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        'h:Reply-To': 'reply@example.com',
      }));
    });

    it('should handle CC recipients as array', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        cc: ['cc1@example.com', 'cc2@example.com'],
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        cc: ['cc1@example.com', 'cc2@example.com'],
      }));
    });

    it('should handle CC recipient as string', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        cc: 'cc@example.com',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        cc: ['cc@example.com'],
      }));
    });

    it('should handle BCC recipients as array', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      }));
    });

    it('should handle BCC recipient as string', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        bcc: 'bcc@example.com',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        bcc: ['bcc@example.com'],
      }));
    });

    it('should handle tags as array', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        tags: ['tag1', 'tag2'],
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        'o:tag': ['tag1', 'tag2'],
      }));
    });

    it('should handle tags as Record', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        tags: { category: 'newsletter', type: 'promotional' },
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        'o:tag': ['category:newsletter', 'type:promotional'],
      }));
    });

    it('should handle custom headers', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-Another-Header': 'another-value',
        },
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        'h:X-Custom-Header': 'custom-value',
        'h:X-Another-Header': 'another-value',
      }));
    });

    it('should handle error from Mailgun API', async () => {
      const error = new Error('Mailgun API error');
      mockMessagesCreate.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const result = await service.sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result).toEqual({
        status: 'failed',
        error: 'Mailgun API error',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send email with Mailgun:', error);
      consoleErrorSpy.mockRestore();
    });

    it('should handle error with message property', async () => {
      const error = { message: 'Custom error message' };
      mockMessagesCreate.mockRejectedValue(error);
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

    it('should handle unknown error format', async () => {
      const error = { code: 500 };
      mockMessagesCreate.mockRejectedValue(error);
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
    let service: MailgunEmailService;

    beforeEach(async () => {
      service = new MailgunEmailService('test-api-key', 'test-domain.com');
      const mailgunModule = await import('mailgun.js');
      mockMessagesCreate = (mailgunModule as any).__mockMessagesCreate;
      mockMessagesCreate.mockClear();
    });

    it('should send simple email with required parameters', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      const result = await service.sendSimpleEmail(
        'recipient@example.com',
        'Test Subject',
        '<p>Test HTML</p>'
      );

      expect(result).toEqual({
        id: 'msg-123',
        status: 'queued',
        error: undefined,
      });
      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', {
        from: 'KH Hub <noreply@khhub.app>',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
    });

    it('should send simple email with text content', async () => {
      mockMessagesCreate.mockResolvedValue({ id: 'msg-123' });

      await service.sendSimpleEmail(
        'recipient@example.com',
        'Test Subject',
        '<p>Test HTML</p>',
        'Test Text'
      );

      expect(mockMessagesCreate).toHaveBeenCalledWith('test-domain.com', expect.objectContaining({
        text: 'Test Text',
      }));
    });
  });
});
