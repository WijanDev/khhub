/**
 * Shared types for email service implementations
 */

export interface SendEmailOptions {
  /** Recipient email address(es) - can be a single string or array */
  to: string | string[];
  /** Email subject */
  subject: string;
  /** HTML content of the email */
  html: string;
  /** Plain text content of the email (optional) */
  text?: string;
  /** Sender email address (defaults to configured from address) */
  from?: string;
  /** Reply-to email address (optional) */
  replyTo?: string;
  /** CC recipients (optional) */
  cc?: string | string[];
  /** BCC recipients (optional) */
  bcc?: string | string[];
  /** Email tags for tracking (optional) - provider-specific format */
  tags?: Record<string, string> | string[];
  /** Custom headers (optional) */
  headers?: Record<string, string>;
}

export interface SendEmailResult {
  /** Email ID from provider */
  id?: string;
  /** Status of the email */
  status?: string;
  /** Error message if sending failed */
  error?: string;
}

/**
 * Email service interface
 * All email providers must implement this interface
 */
export interface EmailService {
  /**
   * Send an email
   * @param options Email options
   * @returns Promise resolving to send result
   */
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;

  /**
   * Send a simple email (convenience method)
   * @param to Recipient email address
   * @param subject Email subject
   * @param html HTML content
   * @param text Plain text content (optional)
   * @returns Promise resolving to send result
   */
  sendSimpleEmail(to: string, subject: string, html: string, text?: string): Promise<SendEmailResult>;
}
