/**
 * Resend email service implementation using Resend SDK
 */

import { Resend } from 'resend';
import type { EmailService, SendEmailOptions, SendEmailResult } from './types';

export class ResendEmailService implements EmailService {
  private apiKey: string;
  private defaultFrom: string;
  private client: Resend;

  constructor(
    apiKey: string,
    defaultFrom: string = 'KH Hub <noreply@khhub.app>'
  ) {
    this.apiKey = apiKey;
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

    // Normalize recipients to arrays
    const toArray = Array.isArray(to) ? to : [to];
    const ccArray = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
    const bccArray = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;

    try {
      // Build email payload for Resend
      // Resend supports: from, to, subject, html, text, cc, bcc, replyTo, headers
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
        to: toArray,
        subject,
        html,
      };

      if (text) {
        emailPayload.text = text;
      }

      if (ccArray) {
        emailPayload.cc = ccArray;
      }

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
