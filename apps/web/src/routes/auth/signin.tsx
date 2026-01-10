import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { Form } from '@/components/ui/form';
import { signIn } from '@/lib/auth-client';
import { SignInSchema } from '@khhub/shared';
import { zodValidator, zodFieldValidator } from '@/lib/form-utils';
import { EmailVerificationCard } from '@/components/ui/email-verification-card';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthError } from '@/components/auth/auth-error';
import { AuthFormField } from '@/components/auth/auth-form-field';
import { AuthFormSubmit } from '@/components/auth/auth-form-submit';

export const Route = createFileRoute('/auth/signin')({
  component: SignInPage,
});

function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');

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

  return (
    emailNotVerified ? (
      <EmailVerificationCard userEmail={userEmail} />
    ) : (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="w-full max-w-md"
      >
        <AuthCard
          title={t('auth.signIn.title')}
          description={t('auth.signIn.description')}
          footer={
            <>
              <AuthFormSubmit
                isSubmitting={form.state.isSubmitting}
                labelKey="auth.signIn.submit"
                submittingLabelKey="auth.signIn.submitting"
              />
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.signIn.noAccount')}{' '}
                <Link to="/auth/signup" className="font-medium text-primary hover:underline">
                  {t('auth.signIn.createAccount')}
                </Link>
              </p>
            </>
          }
        >
          <div className="space-y-4">
            <AuthError error={serverError} />

            <form.Field
              name="email"
              validators={{
                onChange: zodFieldValidator(SignInSchema.shape.email),
              }}
            >
              {(field) => (
                <AuthFormField
                  field={field}
                  id="email"
                  label={t('auth.signIn.email')}
                  type="email"
                  placeholder="name@example.com"
                  disabled={form.state.isSubmitting}
                />
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: zodFieldValidator(SignInSchema.shape.password),
              }}
            >
              {(field) => (
                <AuthFormField
                  field={field}
                  id="password"
                  label={t('auth.signIn.password')}
                  type="password"
                  placeholder="••••••••"
                  disabled={form.state.isSubmitting}
                  rightElement={
                    <Link
                      to="/auth/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      {t('auth.signIn.forgotPassword')}
                    </Link>
                  }
                />
              )}
            </form.Field>
          </div>
        </AuthCard>
      </Form>
    )
  );
}
