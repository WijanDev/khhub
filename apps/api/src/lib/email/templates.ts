/**
 * Email template helpers
 * Provider-agnostic HTML templates
 */

export const EmailTemplates = {
  /**
   * Password reset email HTML template
   */
  passwordReset(name: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e8e8f0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #15151f 0%, #1a1a28 100%); border-radius: 12px; padding: 40px; border: 1px solid rgba(255, 255, 255, 0.06);">
    <h1 style="margin: 0 0 24px; font-size: 24px; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ff006a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
      KH Hub
    </h1>
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">
      Reset your password
    </h2>
    <p style="margin: 0 0 24px; color: #9090a0; line-height: 1.6;">
      Hi ${name},<br><br>
      We received a request to reset your password. Click the button below to choose a new password.
    </p>
    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); color: #0a0a0f; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Reset Password
    </a>
    <p style="margin: 24px 0 0; color: #606070; font-size: 13px; line-height: 1.6;">
      If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.
    </p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.06);">
    <p style="margin: 0; color: #606070; font-size: 12px;">
      This email was sent by KH Hub. If you have questions, contact support.
    </p>
  </div>
</body>
</html>
`;
  },

  /**
   * Welcome email HTML template
   */
  welcome(name: string, loginUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to KH Hub</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e8e8f0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #15151f 0%, #1a1a28 100%); border-radius: 12px; padding: 40px; border: 1px solid rgba(255, 255, 255, 0.06);">
    <h1 style="margin: 0 0 24px; font-size: 24px; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ff006a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
      KH Hub
    </h1>
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">
      Welcome, ${name}!
    </h2>
    <p style="margin: 0 0 24px; color: #9090a0; line-height: 1.6;">
      Thank you for joining KH Hub. We're excited to have you on board!
    </p>
    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); color: #0a0a0f; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Get Started
    </a>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.06);">
    <p style="margin: 0; color: #606070; font-size: 12px;">
      This email was sent by KH Hub. If you have questions, contact support.
    </p>
  </div>
</body>
</html>
`;
  },

  /**
   * Email verification HTML template
   */
  emailVerification(name: string, verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e8e8f0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #15151f 0%, #1a1a28 100%); border-radius: 12px; padding: 40px; border: 1px solid rgba(255, 255, 255, 0.06);">
    <h1 style="margin: 0 0 24px; font-size: 24px; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ff006a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
      KH Hub
    </h1>
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">
      Verify your email address
    </h2>
    <p style="margin: 0 0 24px; color: #9090a0; line-height: 1.6;">
      Hi ${name},<br><br>
      Please verify your email address by clicking the button below.
    </p>
    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); color: #0a0a0f; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Verify Email
    </a>
    <p style="margin: 24px 0 0; color: #606070; font-size: 13px; line-height: 1.6;">
      If you didn't create an account, you can safely ignore this email.
    </p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.06);">
    <p style="margin: 0; color: #606070; font-size: 12px;">
      This email was sent by KH Hub. If you have questions, contact support.
    </p>
  </div>
</body>
</html>
`;
  },

  /**
   * Account deleted email HTML template
   */
  accountDeleted(name: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deleted</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e8e8f0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #15151f 0%, #1a1a28 100%); border-radius: 12px; padding: 40px; border: 1px solid rgba(255, 255, 255, 0.06);">
    <h1 style="margin: 0 0 24px; font-size: 24px; background: linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ff006a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
      KH Hub
    </h1>
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">
      Your account has been deleted
    </h2>
    <p style="margin: 0 0 24px; color: #9090a0; line-height: 1.6;">
      Hi ${name},<br><br>
      Your KH Hub account has been deleted. If you didn't request this, please contact support immediately.
    </p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.06);">
    <p style="margin: 0; color: #606070; font-size: 12px;">
      This email was sent by KH Hub. If you have questions, contact support.
    </p>
  </div>
</body>
</html>
`;
  },
};
