import { z } from 'zod';

/**
 * Authentication related schemas and types
 * All messages use translation keys that should be translated by the client
 */

// Sign In
export const SignInSchema = z.object({
  email: z.string().email('validation.email.invalid'),
  password: z.string().min(8, 'validation.password.minLength').max(128, 'validation.password.maxLength'),
});
export type SignInInput = z.infer<typeof SignInSchema>;

// Sign Up
export const SignUpSchema = z.object({
  name: z.string().min(2, 'validation.name.minLength').max(100, 'validation.name.maxLength'),
  email: z.string().email('validation.email.invalid'),
  password: z.string().min(8, 'validation.password.minLength').max(128, 'validation.password.maxLength'),
});
export type SignUpInput = z.infer<typeof SignUpSchema>;

// Sign Up with confirmation
export const SignUpWithConfirmSchema = SignUpSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.password.mismatch',
  path: ['confirmPassword'],
});
export type SignUpWithConfirmInput = z.infer<typeof SignUpWithConfirmSchema>;

// Forgot Password
export const ForgotPasswordSchema = z.object({
  email: z.string().email('validation.email.invalid'),
  redirectTo: z.string().url('validation.url.invalid').optional(),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// Reset Password
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'validation.token.required'),
  newPassword: z.string().min(8, 'validation.password.minLength').max(128, 'validation.password.maxLength'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// Reset Password with confirmation
export const ResetPasswordWithConfirmSchema = ResetPasswordSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'validation.password.mismatch',
  path: ['confirmPassword'],
});
export type ResetPasswordWithConfirmInput = z.infer<typeof ResetPasswordWithConfirmSchema>;

// Change Password
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'validation.password.minLength').max(128, 'validation.password.maxLength'),
  newPassword: z.string().min(8, 'validation.password.minLength').max(128, 'validation.password.maxLength'),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// Change Password with confirmation
export const ChangePasswordWithConfirmSchema = ChangePasswordSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'validation.password.mismatch',
  path: ['confirmPassword'],
});
export type ChangePasswordWithConfirmInput = z.infer<typeof ChangePasswordWithConfirmSchema>;

// Session User
export const SessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  banned: z.boolean(),
  banReason: z.string().nullable(),
  banExpires: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SessionUser = z.infer<typeof SessionUserSchema>;

// Session
export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
});
export type Session = z.infer<typeof SessionSchema>;

// Auth Session
export const AuthSessionSchema = z.object({
  user: SessionUserSchema,
  session: SessionSchema,
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
