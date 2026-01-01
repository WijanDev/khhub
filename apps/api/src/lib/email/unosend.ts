/**
 * Unosend email service implementation
 */

import type { EmailService, SendEmailOptions, SendEmailResult } from './types';

interface UnosendErrorResponse {
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

interface UnosendSuccessResponse {
  id: string;
  from: string;
  to: string[];
  subject: string;
  status: string;
  created_at: string;
}

export class UnosendEmailService implements EmailService {
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string = 'KH Hub <noreply@khhub.app>') {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
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

    // Build request body
    const body: Record<string, unknown> = {
      from,
      to: toArray,
      subject,
      html,
    };

    if (text) {
      body.text = text;
    }

    if (replyTo) {
      body.reply_to = replyTo;
    }

    if (ccArray) {
      body.cc = ccArray;
    }

    if (bccArray) {
      body.bcc = bccArray;
    }

    // Unosend uses Record<string, string> for tags
    if (tags && typeof tags === 'object' && !Array.isArray(tags) && Object.keys(tags).length > 0) {
      body.tags = tags;
    }

    if (headers) {
      body.headers = headers;
    }

    try {
      const response = await fetch('https://www.unosend.co/api/v1/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send email';
        let errorCode: string | undefined;

        try {
          const errorData = (await response.json()) as UnosendErrorResponse;
          // Unosend error structure: { error: { code, message } }
          if (errorData.error) {
            errorMessage = errorData.error.message || errorMessage;
            errorCode = errorData.error.code;
          } else {
            // Fallback for other error formats
            errorMessage = errorData.message || errorMessage;
          }
        } catch {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            return {
              status: 'failed',
              error: errorMessage,
            };
          }
        }

        console.error('Failed to send email with Unosend:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          code: errorCode,
        });

        return {
          status: 'failed',
          error: errorMessage,
        };
      }

      const data = (await response.json()) as UnosendSuccessResponse;
      return {
        id: data.id,
        status: data.status || 'queued',
        error: undefined,
      };
    } catch (error) {
      console.error('Failed to send email with Unosend:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
