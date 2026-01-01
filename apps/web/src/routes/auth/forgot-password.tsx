import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Mail } from 'lucide-react';
import { getFieldError, hasFieldError, zodFieldValidator, zodValidator } from '@/lib/form-utils';
import { authApi } from '@/lib/api-client';

// Simple schema for forgot password (just email)
const ForgotPasswordFormSchema = z.object({
  email: z.string().email('validation.email.invalid'),
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
        // Use RPC client for auth routes
        const response = await authApi['forget-password'].$post({
          json: {
            email: value.email,
            redirectTo: '/auth/reset-password',
          },
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          setServerError(data.error || t('auth.errors.genericError'));
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
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('auth.forgotPassword.success.title')}</CardTitle>
          <CardDescription>
            {t('auth.forgotPassword.success.description')} <strong>{submittedEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t('auth.forgotPassword.success.hint')}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
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
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t('auth.forgotPassword.title')}</CardTitle>
        <CardDescription>
          {t('auth.forgotPassword.description')}
        </CardDescription>
      </CardHeader>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
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
        </CardFooter>
      </Form>
    </Card>
  );
}
