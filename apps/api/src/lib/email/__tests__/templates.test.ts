import { describe, it, expect } from 'vitest';
import { EmailTemplates } from '../templates';

describe('EmailTemplates', () => {
  describe('passwordReset', () => {
    it('should return HTML template with name and reset URL', () => {
      const html = EmailTemplates.passwordReset('John Doe', 'https://example.com/reset?token=abc123');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('Reset your password');
      expect(html).toContain('John Doe');
      expect(html).toContain('https://example.com/reset?token=abc123');
      expect(html).toContain('Reset Password');
      expect(html).toContain('KH Hub');
    });

    it('should handle special characters in name', () => {
      const html = EmailTemplates.passwordReset("O'Brien & Co.", 'https://example.com/reset');

      expect(html).toContain("O'Brien & Co.");
    });

    it('should include reset URL in anchor tag', () => {
      const html = EmailTemplates.passwordReset('Test User', 'https://example.com/reset?token=xyz');

      expect(html).toContain('href="https://example.com/reset?token=xyz"');
    });
  });

  describe('welcome', () => {
    it('should return HTML template with name and login URL', () => {
      const html = EmailTemplates.welcome('Jane Smith', 'https://example.com/login');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('Welcome to KH Hub');
      expect(html).toContain('Jane Smith');
      expect(html).toContain('https://example.com/login');
      expect(html).toContain('Get Started');
      expect(html).toContain('KH Hub');
    });

    it('should handle special characters in name', () => {
      const html = EmailTemplates.welcome("María José", 'https://example.com/login');

      expect(html).toContain('María José');
    });

    it('should include login URL in anchor tag', () => {
      const html = EmailTemplates.welcome('Test User', 'https://example.com/login');

      expect(html).toContain('href="https://example.com/login"');
    });
  });

  describe('emailVerification', () => {
    it('should return HTML template with name and verification URL', () => {
      const html = EmailTemplates.emailVerification('Bob Johnson', 'https://example.com/verify?token=def456');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('Verify your email');
      expect(html).toContain('Bob Johnson');
      expect(html).toContain('https://example.com/verify?token=def456');
      expect(html).toContain('Verify Email');
      expect(html).toContain('KH Hub');
    });

    it('should handle special characters in name', () => {
      const html = EmailTemplates.emailVerification('François', 'https://example.com/verify');

      expect(html).toContain('François');
    });

    it('should include verification URL in anchor tag', () => {
      const html = EmailTemplates.emailVerification('Test User', 'https://example.com/verify?token=abc');

      expect(html).toContain('href="https://example.com/verify?token=abc"');
    });
  });

  describe('accountDeleted', () => {
    it('should return HTML template with name', () => {
      const html = EmailTemplates.accountDeleted('Alice Williams');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('Account Deleted');
      expect(html).toContain('Alice Williams');
      expect(html).toContain('Your account has been deleted');
      expect(html).toContain('KH Hub');
    });

    it('should handle special characters in name', () => {
      const html = EmailTemplates.accountDeleted("D'Angelo");

      expect(html).toContain("D'Angelo");
    });

    it('should not include any URL', () => {
      const html = EmailTemplates.accountDeleted('Test User');

      expect(html).not.toContain('href=');
    });
  });

  describe('template structure', () => {
    it('should include proper HTML structure in all templates', () => {
      const templates = [
        EmailTemplates.passwordReset('Test', 'https://example.com/reset'),
        EmailTemplates.welcome('Test', 'https://example.com/login'),
        EmailTemplates.emailVerification('Test', 'https://example.com/verify'),
        EmailTemplates.accountDeleted('Test'),
      ];

      templates.forEach((html) => {
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html>');
        expect(html).toContain('<head>');
        expect(html).toContain('<body');
        expect(html).toContain('KH Hub');
      });
    });

    it('should include meta tags in all templates', () => {
      const templates = [
        EmailTemplates.passwordReset('Test', 'https://example.com/reset'),
        EmailTemplates.welcome('Test', 'https://example.com/login'),
        EmailTemplates.emailVerification('Test', 'https://example.com/verify'),
        EmailTemplates.accountDeleted('Test'),
      ];

      templates.forEach((html) => {
        expect(html).toContain('<meta charset="utf-8">');
        expect(html).toContain('<meta name="viewport"');
      });
    });
  });
});
