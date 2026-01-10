/**
 * Email template helpers
 * Provider-agnostic HTML templates
 */

const LAYOUT = {
  backgroundColor: '#0a0a0f',
  textColor: '#e8e8f0',
  cardBackground: 'linear-gradient(135deg, #15151f 0%, #1a1a28 100%)',
  accentGradient: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ff006a 100%)',
  mutedColor: '#9090a0',
  secondaryMutedColor: '#606070',
  borderColor: 'rgba(255, 255, 255, 0.06)',
};

/**
 * Wraps content in the shared email HTML structure
 */
function wrapTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${LAYOUT.backgroundColor}; color: ${LAYOUT.textColor}; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: ${LAYOUT.cardBackground}; border-radius: 12px; padding: 40px; border: 1px solid ${LAYOUT.borderColor};">
    <h1 style="margin: 0 0 24px; font-size: 24px; background: ${LAYOUT.accentGradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
      KH Hub
    </h1>
    ${content}
    <hr style="margin: 32px 0; border: none; border-top: 1px solid ${LAYOUT.borderColor};">
    <p style="margin: 0; color: ${LAYOUT.secondaryMutedColor}; font-size: 12px;">
      This email was sent by KH Hub. If you have questions, contact support.
    </p>
  </div>
</body>
</html>
`;
}

export const EmailTemplates = {
  /**
   * Password reset email HTML template
   */
  passwordReset(name: string, resetUrl: string): string {
    const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">
      Reset your password
    </h2>
    <p style="margin: 0 0 24px; color: ${LAYOUT.mutedColor}; line-height: 1.6;">
      Hi ${name},<br><br>
      We received a request to reset your password. Click the button below to choose a new password.
    </p>
    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); color: #0a0a0f; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Reset Password
    </a>
    <p style="margin: 24px 0 0; color: ${LAYOUT.secondaryMutedColor}; font-size: 13px; line-height: 1.6;">
      If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.
    </p>
    `;
    return wrapTemplate('Reset your password', content);
  },

  /**
   * Welcome email HTML template
   */
  welcome(name: string, loginUrl: string): string {
    const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">
      Welcome, ${name}!
    </h2>
    <p style="margin: 0 0 24px; color: ${LAYOUT.mutedColor}; line-height: 1.6;">
      Thank you for joining KH Hub. We're excited to have you on board!
    </p>
    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); color: #0a0a0f; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Get Started
    </a>
    `;
    return wrapTemplate('Welcome to KH Hub', content);
  },

  /**
   * Email verification HTML template
   */
  emailVerification(name: string, verificationUrl: string): string {
    const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">
      Verify your email address
    </h2>
    <p style="margin: 0 0 24px; color: ${LAYOUT.mutedColor}; line-height: 1.6;">
      Hi ${name},<br><br>
      Please verify your email address by clicking the button below.
    </p>
    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); color: #0a0a0f; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Verify Email
    </a>
    <p style="margin: 24px 0 0; color: ${LAYOUT.secondaryMutedColor}; font-size: 13px; line-height: 1.6;">
      If you didn't create an account, you can safely ignore this email.
    </p>
    `;
    return wrapTemplate('Verify your email', content);
  },

  /**
   * Account deleted email HTML template
   */
  accountDeleted(name: string): string {
    const content = `
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">
      Your account has been deleted
    </h2>
    <p style="margin: 0 0 24px; color: ${LAYOUT.mutedColor}; line-height: 1.6;">
      Hi ${name},<br><br>
      Your KH Hub account has been deleted. If you didn't request this, please contact support immediately.
    </p>
    `;
    return wrapTemplate('Account Deleted', content);
  },
};

