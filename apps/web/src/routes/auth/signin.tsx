import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { signIn } from '@/lib/auth-client';
import { SignInSchema } from '@khhub/shared';
import { getFieldError, hasFieldError, zodFieldValidator, zodValidator } from '@/lib/form-utils';
import { authApi } from '@/lib/api-client';

export const Route = createFileRoute('/auth/signin')({
  component: SignInPage,
});

function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: zodValidator(SignInSchema),
    },
    onSubmit: async ({ value }) => {
      setServerError('');
      setEmailNotVerified(false);
      setResendSuccess(false);

      try {
        const result = await signIn.email({
          email: value.email,
          password: value.password,
        });

        if (result.error) {
          // Check if error is related to email verification
          const errorMessage = result.error.message || result.error.toString();
          if (
            errorMessage.toLowerCase().includes('email') &&
            (errorMessage.toLowerCase().includes('verify') ||
              errorMessage.toLowerCase().includes('verification') ||
              errorMessage.toLowerCase().includes('not verified'))
          ) {
            setEmailNotVerified(true);
            setUserEmail(value.email);
            setServerError(t('auth.errors.emailNotVerified'));
          } else {
            setServerError(t('auth.errors.invalidCredentials'));
          }
          return;
        }

        navigate({ to: '/app/dashboard' });
      } catch (error: any) {
        // Check if error is related to email verification
        const errorMessage = error?.message || error?.toString() || '';
        if (
          errorMessage.toLowerCase().includes('email') &&
          (errorMessage.toLowerCase().includes('verify') ||
            errorMessage.toLowerCase().includes('verification') ||
            errorMessage.toLowerCase().includes('not verified'))
        ) {
          setEmailNotVerified(true);
          setUserEmail(form.state.values.email);
          setServerError(t('auth.errors.emailNotVerified'));
        } else {
          setServerError(t('auth.errors.genericError'));
        }
      }
    },
  });

  const handleResendVerification = async () => {
    if (!userEmail) return;

    setResendingVerification(true);
    setResendSuccess(false);
    setServerError('');

    try {
      const response = await authApi['resend-verification'].$post({
        json: { email: userEmail },
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setServerError(data.error || t('auth.emailVerification.resendError'));
        return;
      }

      setResendSuccess(true);
      setServerError('');
    } catch {
      setServerError(t('auth.emailVerification.resendError'));
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t('auth.signIn.title')}</CardTitle>
        <CardDescription>{t('auth.signIn.description')}</CardDescription>
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

          {emailNotVerified && (
            <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-3">
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                <p className="font-medium mb-2">{t('auth.errors.emailVerificationRequired')}</p>
                <p>{t('auth.emailVerification.description')}</p>
              </div>
              {resendSuccess ? (
                <div className="text-sm text-green-600 dark:text-green-400">
                  {t('auth.emailVerification.resendSuccess')}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="w-full"
                >
                  {resendingVerification
                    ? t('auth.emailVerification.resending')
                    : t('auth.emailVerification.resend')}
                </Button>
              )}
            </div>
          )}

          <form.Field
            name="email"
            validators={{
              onChange: zodFieldValidator(SignInSchema.shape.email),
            }}
          >
            {(field) => (
              <FormField field={field}>
                <FormLabel htmlFor="email">{t('auth.signIn.email')}</FormLabel>
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

          <form.Field
            name="password"
            validators={{
              onChange: zodFieldValidator(SignInSchema.shape.password),
            }}
          >
            {(field) => (
              <FormField field={field}>
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="password">{t('auth.signIn.password')}</FormLabel>
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    {t('auth.signIn.forgotPassword')}
                  </Link>
                </div>
                <FormControl>
                  <Input
                    id="password"
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.signIn.noAccount')}{' '}
            <Link to="/auth/signup" className="font-medium text-primary hover:underline">
              {t('auth.signIn.createAccount')}
            </Link>
          </p>
        </CardFooter>
      </Form>
    </Card>
  );
}
