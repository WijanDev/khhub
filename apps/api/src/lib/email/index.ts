/**
 * Email service exports
 * Provides a unified interface for email sending with multiple provider support
 */

import type { EmailService } from './types';
import { UnosendEmailService } from './unosend';
import { MailgunEmailService } from './mailgun';
import { ResendEmailService } from './resend';
import { EmailTemplates } from './templates';

export type { EmailService, SendEmailOptions, SendEmailResult } from './types';
export { UnosendEmailService } from './unosend';
export { MailgunEmailService } from './mailgun';
export { ResendEmailService } from './resend';
export { EmailTemplates } from './templates';

/**
 * Create an email service instance based on provider configuration
 */
export function createEmailService(
  provider: 'unosend' | 'mailgun' | 'resend',
  config: {
    unosendApiKey?: string;
    mailgunApiKey?: string;
    mailgunDomain?: string;
    resendApiKey?: string;
    defaultFrom?: string;
  }
): EmailService {
  const { defaultFrom = 'KH Hub <noreply@khhub.app>' } = config;

  switch (provider) {
    case 'unosend':
      if (!config.unosendApiKey) {
        throw new Error('UNOSEND_API_KEY is required for Unosend provider');
      }
      return new UnosendEmailService(config.unosendApiKey, defaultFrom);

    case 'mailgun':
      if (!config.mailgunApiKey || !config.mailgunDomain) {
        throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN are required for Mailgun provider');
      }
      return new MailgunEmailService(config.mailgunApiKey, config.mailgunDomain, defaultFrom);

    case 'resend':
      if (!config.resendApiKey) {
        throw new Error('RESEND_API_KEY is required for Resend provider');
      }
      return new ResendEmailService(config.resendApiKey, defaultFrom);

    default:
      throw new Error(`Unknown email provider: ${provider}. Must be 'unosend', 'mailgun', or 'resend'`);
  }
}
