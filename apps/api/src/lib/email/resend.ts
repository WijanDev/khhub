/**
 * Resend email service implementation using Resend SDK
 */

import { Resend } from 'resend';
import type { SendEmailOptions, SendEmailResult } from './types';
import { AbstractEmailService } from './base';

export class ResendEmailService extends AbstractEmailService {
  private readonly defaultFrom: string;
  private readonly client: Resend;

  constructor(
    apiKey: string,
    defaultFrom: string = 'KH Hub <noreply@khhub.app>'
  ) {
    super();
    this.defaultFrom = defaultFrom;
    this.client = new Resend(apiKey);
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

    try {
      // Build email payload for Resend
      const emailPayload: {
        from: string;
        to: string | string[];
        subject: string;
        html: string;
        text?: string;
        cc?: string | string[];
        bcc?: string | string[];
        replyTo?: string;
        headers?: Record<string, string>;
      } = {
        from,
        to: this.normalizeToRecipients(to),
        subject,
        html,
      };

      if (text) {
        emailPayload.text = text;
      }

      const ccArray = this.normalizeRecipients(cc);
      if (ccArray) {
        emailPayload.cc = ccArray;
      }

      const bccArray = this.normalizeRecipients(bcc);
      if (bccArray) {
        emailPayload.bcc = bccArray;
      }

      if (replyTo) {
        emailPayload.replyTo = replyTo;
      }

      if (headers) {
        emailPayload.headers = headers;
      }

      // Note: Resend doesn't support tags in the same way as other providers
      // Tags can be added via custom headers if needed
      if (tags && !headers) {
        // Convert tags to custom headers if headers not already provided
        emailPayload.headers = Array.isArray(tags)
          ? tags.reduce((acc, tag) => ({ ...acc, [`X-Tag-${tag}`]: 'true' }), {})
          : Object.entries(tags).reduce((acc, [key, value]) => ({ ...acc, [`X-Tag-${key}`]: value }), {});
      }

      const { data, error } = await this.client.emails.send(emailPayload);

      if (error) {
        console.error('Failed to send email with Resend:', error);
        return {
          status: 'failed',
          error: error.message || 'Unknown error',
        };
      }

      return {
        id: data?.id,
        status: 'sent', // Resend sends emails immediately
        error: undefined,
      };
    } catch (error: unknown) {
      console.error('Failed to send email with Resend:', error);
      return {
        status: 'failed',
        error: this.getErrorMessage(error),
      };
    }
  }
}
