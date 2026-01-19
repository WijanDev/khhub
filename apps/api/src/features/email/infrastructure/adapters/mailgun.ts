/**
 * Mailgun email service implementation using Mailgun SDK
 */

import Mailgun from 'mailgun.js';
import type { SendEmailOptions, SendEmailResult } from '@email/domain/types';
import { AbstractEmailService } from './base';

// Type for Mailgun message data - using the SDK's expected structure
type MailgunMessageData = {
  from?: string;
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  message?: string | Blob | ArrayBuffer;
  template?: string;
  'h:Reply-To'?: string;
  'h:X-My-Header'?: string;
  'o:tag'?: string | string[];
  [key: string]: unknown;
};

export class MailgunEmailService extends AbstractEmailService {
  private readonly domain: string;
  private readonly defaultFrom: string;
  private readonly client: ReturnType<typeof Mailgun.prototype.client>;

  constructor(
    apiKey: string,
    domain: string,
    defaultFrom: string = 'KH Hub <noreply@khhub.app>'
  ) {
    super();
    this.domain = domain;
    this.defaultFrom = defaultFrom;

    // Initialize Mailgun client with native FormData (Cloudflare Workers compatible)
    const mailgun = new Mailgun(FormData);
    this.client = mailgun.client({
      username: 'api',
      key: apiKey,
      url: 'https://api.mailgun.net',
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const messageData = this.createMessageData(options);

    try {
      // Type assertion: we ensure html is always provided, satisfying MailgunMessageContent requirement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.client.messages.create(this.domain, messageData as any);

      return {
        id: response.id,
        status: 'queued',
        error: undefined,
      };
    } catch (error: unknown) {
      console.error('Failed to send email with Mailgun:', error);
      return {
        status: 'failed',
        error: this.getErrorMessage(error),
      };
    }
  }

  private createMessageData(options: SendEmailOptions): MailgunMessageData {
    const {
      to,
      subject,
      html,
      text,
      from = this.defaultFrom,
      replyTo,
      cc,
      bcc,
      tags,
      headers,
    } = options;

    const messageData: MailgunMessageData = {
      from,
      to: this.normalizeToRecipients(to),
      subject,
      html,
    };

    if (text) {
      messageData.text = text;
    }

    if (replyTo) {
      messageData['h:Reply-To'] = replyTo;
    }

    const ccArray = this.normalizeRecipients(cc);
    if (ccArray) {
      messageData.cc = ccArray;
    }

    const bccArray = this.normalizeRecipients(bcc);
    if (bccArray) {
      messageData.bcc = bccArray;
    }

    if (tags) {
      if (Array.isArray(tags)) {
        messageData['o:tag'] = tags;
      } else {
        messageData['o:tag'] = Object.entries(tags).map(([key, value]) => `${key}:${value}`);
      }
    }

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        (messageData as Record<string, unknown>)[`h:${key}`] = value;
      });
    }

    return messageData;
  }
}
