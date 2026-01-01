/**
 * Email service initialization helper
 * Creates the appropriate email service based on environment configuration
 */

import type { Env } from '../../types';
import { createEmailService, type EmailService } from './index';

/**
 * Create email service from environment configuration
 */
export function createEmailServiceFromEnv(env: Env): EmailService {
  const provider = env.EMAIL_PROVIDER || 'resend'; // Default to resend

  if (provider === 'resend') {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER is resend');
    }
    return createEmailService('resend', {
      resendApiKey: env.RESEND_API_KEY,
    });
  }

  if (provider === 'mailgun') {
    if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN) {
      throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN are required when EMAIL_PROVIDER is mailgun');
    }
    return createEmailService('mailgun', {
      mailgunApiKey: env.MAILGUN_API_KEY,
      mailgunDomain: env.MAILGUN_DOMAIN,
    });
  }

  if (provider === 'unosend') {
    if (!env.UNOSEND_API_KEY) {
      throw new Error('UNOSEND_API_KEY is required when EMAIL_PROVIDER is unosend');
    }
    return createEmailService('unosend', {
      unosendApiKey: env.UNOSEND_API_KEY,
    });
  }

  throw new Error(`Unknown email provider: ${provider}. Must be 'unosend', 'mailgun', or 'resend'`);
}
