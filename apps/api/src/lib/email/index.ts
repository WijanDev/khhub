/**
 * Email service exports
 * Provides a unified interface for email sending with multiple provider support
 */

import type { EmailService } from './types';
import { UnosendEmailService } from './unosend';
import { MailgunEmailService } from './mailgun';
import { ResendEmailService } from './resend';

export type { EmailService, SendEmailOptions, SendEmailResult } from './types';
export { UnosendEmailService } from './unosend';
export { MailgunEmailService } from './mailgun';
export { ResendEmailService } from './resend';

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

  const providers: Record<string, () => EmailService> = {
    unosend: () => {
      if (!config.unosendApiKey) {
        throw new Error('UNOSEND_API_KEY is required for Unosend provider');
      }
      return new UnosendEmailService(config.unosendApiKey, defaultFrom);
    },
    mailgun: () => {
      if (!config.mailgunApiKey || !config.mailgunDomain) {
        throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN are required for Mailgun provider');
      }
      return new MailgunEmailService(config.mailgunApiKey, config.mailgunDomain, defaultFrom);
    },
    resend: () => {
      if (!config.resendApiKey) {
        throw new Error('RESEND_API_KEY is required for Resend provider');
      }
      return new ResendEmailService(config.resendApiKey, defaultFrom);
    },
  };

  const createProvider = providers[provider];
  if (!createProvider) {
    throw new Error(`Unknown email provider: ${provider}. Must be 'unosend', 'mailgun', or 'resend'`);
  }

  return createProvider();
}
