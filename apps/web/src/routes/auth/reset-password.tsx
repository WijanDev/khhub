import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { zodFieldValidator, zodValidator } from '@/lib/form-utils';
import { resetPassword } from '@/lib/auth-client';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthFormSubmit } from '@/components/auth/auth-form-submit';
import { BaseAuthForm } from '@/components/auth/base-auth-form';
import { BaseAuthField } from '@/components/auth/base-auth-field';
import { ConfirmPasswordField } from '@/components/auth/confirm-password-field';

// Schema for password field
const PasswordSchema = z.string()
  .min(8, { message: 'validation.password.minLength' })
  .max(128, { message: 'validation.password.maxLength' });

// Schema for reset password with confirmation
const ResetPasswordFormSchema = z.object({
  newPassword: PasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'validation.password.mismatch',
  path: ['confirmPassword'],
});

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || '',
    };
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: zodValidator(ResetPasswordFormSchema),
    },
    onSubmit: async ({ value }) => {
      setServerError('');

      if (!token) {
        setServerError(t('auth.resetPassword.invalidLink.description'));
        return;
      }

      try {
        // Use Better Auth client
        const response = await resetPassword({
          newPassword: value.newPassword,
          token,
        });

        if (response.error) {
          setServerError(response.error.message || t('auth.errors.genericError'));
          return;
        }

        setSuccess(true);
      } catch {
        setServerError(t('auth.errors.genericError'));
      }
    },
  });

  if (success) {
    return (
      <AuthCard
        title={t('auth.resetPassword.success.title')}
        description={t('auth.resetPassword.success.description')}
        footer={
          <Button className="w-full" onClick={() => navigate({ to: '/auth/signin' })}>
            {t('auth.resetPassword.success.signIn')}
          </Button>
        }
      >
        <div className="flex justify-center py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>
      </AuthCard>
    );
  }

  if (!token) {
    return (
      <AuthCard
        title={t('auth.resetPassword.invalidLink.title')}
        description={t('auth.resetPassword.invalidLink.description')}
        footer={
          <div className="flex flex-col space-y-4">
            <Button className="w-full" asChild>
              <Link to="/auth/forgot-password">{t('auth.resetPassword.invalidLink.requestNew')}</Link>
            </Button>
            <Link
              to="/auth/signin"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth.resetPassword.backToSignIn')}
            </Link>
          </div>
        }
      >
        <div />
      </AuthCard>
    );
  }

  return (
    <BaseAuthForm
      form={form}
      title={t('auth.resetPassword.title')}
      description={t('auth.resetPassword.description')}
      serverError={serverError}
      footer={
        <div className="flex flex-col space-y-4">
          <AuthFormSubmit
            isSubmitting={form.state.isSubmitting}
            labelKey="auth.resetPassword.submit"
            submittingLabelKey="auth.resetPassword.submitting"
          />
          <Link
            to="/auth/signin"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('auth.resetPassword.backToSignIn')}
          </Link>
        </div>
      }
    >
      <BaseAuthField
        Field={form.Field}
        name="newPassword"
        label={t('auth.resetPassword.newPassword')}
        type="password"
        placeholder="••••••••"
        validator={zodFieldValidator(PasswordSchema)}
        disabled={form.state.isSubmitting}
      />

      <ConfirmPasswordField
        Field={form.Field}
        passwordFieldName="newPassword"
        label={t('auth.resetPassword.confirmPassword')}
        disabled={form.state.isSubmitting}
      />
    </BaseAuthForm>
  );
}
