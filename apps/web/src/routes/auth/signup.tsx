import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { signUp } from '@/lib/auth-client';
import { SignUpSchema } from '@khhub/shared';
import { zodFieldValidator, zodValidator } from '@/lib/form-utils';
import { EmailVerificationCard } from '@/components/ui/email-verification-card';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthError } from '@/components/auth/auth-error';
import { AuthFormField } from '@/components/auth/auth-form-field';
import { AuthFormSubmit } from '@/components/auth/auth-form-submit';

// Extended schema with password confirmation
const SignUpFormSchema = SignUpSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.password.mismatch',
  path: ['confirmPassword'],
});

export const Route = createFileRoute('/auth/signup')({
  component: SignUpPage,
});

function SignUpPage() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: zodValidator(SignUpFormSchema),
    },
    onSubmit: async ({ value }) => {
      setServerError('');

      try {
        const result = await signUp.email({
          email: value.email,
          password: value.password,
          name: value.name,
        });

        if (result.error) {
          setServerError(result.error.message || t('auth.errors.genericError'));
          return;
        }

        // Show success message with email verification notice
        setSignUpSuccess(true);
        setUserEmail(value.email);
      } catch {
        setServerError(t('auth.errors.genericError'));
      }
    },
  });

  // Show success state with email verification notice
  if (signUpSuccess) {
    return <EmailVerificationCard userEmail={userEmail} />
  }

  return (
    <>
      {signUpSuccess ? <EmailVerificationCard userEmail={userEmail} /> : (
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="w-full max-w-md"
        >
          <AuthCard
            title={t('auth.signUp.title')}
            description={t('auth.signUp.description')}
            footer={
              <>
                <AuthFormSubmit
                  isSubmitting={form.state.isSubmitting}
                  labelKey="auth.signUp.submit"
                  submittingLabelKey="auth.signUp.submitting"
                />
                <p className="text-center text-sm text-muted-foreground">
                  {t('auth.signUp.hasAccount')}{' '}
                  <Link to="/auth/signin" className="font-medium text-primary hover:underline">
                    {t('auth.signUp.signIn')}
                  </Link>
                </p>
              </>
            }
          >
            <div className="space-y-4">
              <AuthError error={serverError} />

              <form.Field
                name="name"
                validators={{
                  onChange: zodFieldValidator(SignUpSchema.shape.name),
                }}
              >
                {(field) => (
                  <AuthFormField
                    field={field}
                    id="name"
                    label={t('auth.signUp.name')}
                    placeholder="John Doe"
                    disabled={form.state.isSubmitting}
                  />
                )}
              </form.Field>

              <form.Field
                name="email"
                validators={{
                  onChange: zodFieldValidator(SignUpSchema.shape.email),
                }}
              >
                {(field) => (
                  <AuthFormField
                    field={field}
                    id="email"
                    label={t('auth.signUp.email')}
                    type="email"
                    placeholder="name@example.com"
                    disabled={form.state.isSubmitting}
                  />
                )}
              </form.Field>

              <form.Field
                name="password"
                validators={{
                  onChange: zodFieldValidator(SignUpSchema.shape.password),
                }}
              >
                {(field) => (
                  <AuthFormField
                    field={field}
                    id="password"
                    label={t('auth.signUp.password')}
                    type="password"
                    placeholder="••••••••"
                    disabled={form.state.isSubmitting}
                  />
                )}
              </form.Field>

              <form.Field
                name="confirmPassword"
                validators={{
                  onChange: ({ value, fieldApi }) => {
                    const password = fieldApi.form.getFieldValue('password');
                    if (value && password && value !== password) {
                      return 'validation.password.mismatch';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <AuthFormField
                    field={field}
                    id="confirmPassword"
                    label={t('auth.signUp.confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    disabled={form.state.isSubmitting}
                  />
                )}
              </form.Field>
            </div>
          </AuthCard>
        </Form>
      )}
    </>
  );
}
