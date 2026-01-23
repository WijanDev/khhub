/**
 * Base abstract class for email services
 * Provides common functionality for recipient normalization and error handling
 */

import type { EmailService, SendEmailOptions, SendEmailResult } from '@email/domain/types';

export abstract class AbstractEmailService implements EmailService {
    abstract sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;

    async sendSimpleEmail(to: string, subject: string, html: string, text?: string): Promise<SendEmailResult> {
        return this.sendEmail({ to, subject, html, text });
    }

    /**
     * Normalize a single recipient or array of recipients to an array of strings
     * Returns undefined if the input is undefined
     */
    protected normalizeRecipients(param: string | string[] | undefined): string[] | undefined {
        if (!param) return undefined;
        return Array.isArray(param) ? param : [param];
    }

    /**
     * Normalize a single recipient or array of recipients to an array of strings
     * Returns the input wrapped in an array if it's a string, or the array itself
     * Useful for 'to' field which is required and usually normalized at the start
     */
    protected normalizeToRecipients(param: string | string[]): string[] {
        return Array.isArray(param) ? param : [param];
    }

    /**
     * Extract a safe error message from an unknown error object
     */
    protected getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
            return String((error as any).message);
        }
        return 'Unknown error';
    }
}
