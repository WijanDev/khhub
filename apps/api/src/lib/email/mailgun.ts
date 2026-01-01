/**
 * Mailgun email service implementation using Mailgun SDK
 */

import Mailgun from 'mailgun.js';
import type { EmailService, SendEmailOptions, SendEmailResult } from './types';

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

export class MailgunEmailService implements EmailService {
  private apiKey: string;
  private domain: string;
  private defaultFrom: string;
  private client: ReturnType<typeof Mailgun.prototype.client>;

  constructor(
    apiKey: string,
    domain: string,
    defaultFrom: string = 'KH Hub <noreply@khhub.app>'
  ) {
    this.apiKey = apiKey;
    this.domain = domain;
    this.defaultFrom = defaultFrom;
    
    // Initialize Mailgun client with native FormData (Cloudflare Workers compatible)
    const mailgun = new Mailgun(FormData);
    this.client = mailgun.client({
      username: 'api',
      key: apiKey,
      url: 'https://api.mailgun.net', // Use 'https://api.eu.mailgun.net' for EU domains
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
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

    // Normalize recipients to arrays
    const toArray = Array.isArray(to) ? to : [to];
    const ccArray = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
    const bccArray = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;

    // Build message data object for Mailgun SDK
    // MailgunMessageData requires at least one of: text, html, message, or template
    const messageData: MailgunMessageData = {
      from,
      to: toArray,
      subject,
      html, // Required: at least one of text/html/message/template
    };

    if (text) {
      messageData.text = text;
    }

    if (replyTo) {
      messageData['h:Reply-To'] = replyTo;
    }

    if (ccArray) {
      messageData.cc = ccArray;
    }

    if (bccArray) {
      messageData.bcc = bccArray;
    }

    // Mailgun uses tags as array of strings
    if (tags) {
      if (Array.isArray(tags)) {
        messageData['o:tag'] = tags;
      } else {
        // If tags is Record<string, string>, convert to array of key-value pairs
        messageData['o:tag'] = Object.entries(tags).map(([key, value]) => `${key}:${value}`);
      }
    }

    // Mailgun custom headers use h: prefix
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        // Use index signature for custom headers
        (messageData as Record<string, unknown>)[`h:${key}`] = value;
      });
    }

    try {
      // Type assertion: we ensure html is always provided, satisfying MailgunMessageContent requirement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await this.client.messages.create(this.domain, messageData as any);

      return {
        id: response.id,
        status: 'queued', // Mailgun queues emails by default
        error: undefined,
      };
    } catch (error: unknown) {
      console.error('Failed to send email with Mailgun:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }

      return {
        status: 'failed',
        error: errorMessage,
      };
    }
  }

  async sendSimpleEmail(to: string, subject: string, html: string, text?: string): Promise<SendEmailResult> {
    return this.sendEmail({ to, subject, html, text });
  }
}
