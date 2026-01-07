import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { getFieldError, hasFieldError, zodFieldValidator, zodValidator } from '@/lib/form-utils';
import { resetPassword } from '@/lib/auth-client';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthError } from '@/components/auth/auth-error';

// Schema for password field
const PasswordSchema = z.string().min(8, 'validation.password.minLength').max(128, 'validation.password.maxLength');

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
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="w-full max-w-md"
    >
      <AuthCard
        title={t('auth.resetPassword.title')}
        description={t('auth.resetPassword.description')}
        footer={
          <div className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
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
        <div className="space-y-4">
          <AuthError error={serverError} />

          <form.Field
            name="newPassword"
            validators={{
              onChange: zodFieldValidator(PasswordSchema),
            }}
          >
            {(field) => (
              <FormField field={field}>
                <FormLabel htmlFor="newPassword">{t('auth.resetPassword.newPassword')}</FormLabel>
                <FormControl>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={form.state.isSubmitting}
                  />
                </FormControl>
                {hasFieldError(field.state.meta.isBlurred, field.state.meta.errors) && (
                  <FormMessage>{getFieldError(field.state.meta.errors, t)}</FormMessage>
                )}
              </FormField>
            )}
          </form.Field>

          <form.Field
            name="confirmPassword"
            validators={{
              onChange: ({ value, fieldApi }) => {
                const password = fieldApi.form.getFieldValue('newPassword');
                if (value && password && value !== password) {
                  return 'validation.password.mismatch';
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <FormField field={field}>
                <FormLabel htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword')}</FormLabel>
                <FormControl>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={form.state.isSubmitting}
                  />
                </FormControl>
                {hasFieldError(field.state.meta.isBlurred, field.state.meta.errors) && (
                  <FormMessage>{getFieldError(field.state.meta.errors, t)}</FormMessage>
                )}
              </FormField>
            )}
          </form.Field>
        </div>
      </AuthCard>
    </Form>
  );
}
