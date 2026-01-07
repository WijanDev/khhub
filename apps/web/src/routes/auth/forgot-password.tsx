import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Mail } from 'lucide-react';
import { getFieldError, hasFieldError, zodFieldValidator, zodValidator } from '@/lib/form-utils';
import { requestPasswordReset } from '@/lib/auth-client';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthError } from '@/components/auth/auth-error';

// Simple schema for forgot password (just email)
const ForgotPasswordFormSchema = z.object({
  email: z.email('validation.email.invalid'),
});

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm({
    defaultValues: {
      email: '',
    },
    validators: {
      onSubmit: zodValidator(ForgotPasswordFormSchema),
    },
    onSubmit: async ({ value }) => {
      setServerError('');

      try {
        // Use Better Auth client
        const response = await requestPasswordReset({
          email: value.email,
        });

        if (response.error) {
          setServerError(response.error.message || t('auth.errors.genericError'));
          return;
        }

        setSubmittedEmail(value.email);
        setSuccess(true);
      } catch {
        setServerError(t('auth.errors.genericError'));
      }
    },
  });

  if (success) {
    return (
      <AuthCard
        title={t('auth.forgotPassword.success.title')}
        description={
          <>
            {t('auth.forgotPassword.success.description')} <strong>{submittedEmail}</strong>
          </>
        }
        footer={
          <div className="flex flex-col space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSuccess(false);
                form.reset();
              }}
            >
              {t('auth.forgotPassword.success.tryAnother')}
            </Button>
            <Link
              to="/auth/signin"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth.forgotPassword.backToSignIn')}
            </Link>
          </div>
        }
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('auth.forgotPassword.success.hint')}
          </p>
        </div>
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
        title={t('auth.forgotPassword.title')}
        description={t('auth.forgotPassword.description')}
        footer={
          <>
            <Button type="submit" className="w-full" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit')}
            </Button>
            <Link
              to="/auth/signin"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth.forgotPassword.backToSignIn')}
            </Link>
          </>
        }
      >
        <div className="space-y-4">
          <AuthError error={serverError} />

          <form.Field
            name="email"
            validators={{
              onChange: zodFieldValidator(ForgotPasswordFormSchema.shape.email),
            }}
          >
            {(field) => (
              <FormField field={field}>
                <FormLabel htmlFor="email">{t('auth.forgotPassword.email')}</FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
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
