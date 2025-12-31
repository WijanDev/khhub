import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { signUp } from '@/lib/auth-client';
import { SignUpSchema } from '@khhub/shared';
import { getFieldError, hasFieldError, zodFieldValidator, zodValidator } from '@/lib/form-utils';

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
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

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

        navigate({ to: '/app/dashboard' });
      } catch {
        setServerError(t('auth.errors.genericError'));
      }
    },
  });

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t('auth.signUp.title')}</CardTitle>
        <CardDescription>{t('auth.signUp.description')}</CardDescription>
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
            name="name"
            validators={{
              onChange: zodFieldValidator(SignUpSchema.shape.name),
            }}
          >
            {(field) => (
              <FormField field={field}>
                <FormLabel htmlFor="name">{t('auth.signUp.name')}</FormLabel>
                <FormControl>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
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
            name="email"
            validators={{
              onChange: zodFieldValidator(SignUpSchema.shape.email),
            }}
          >
            {(field) => (
              <FormField field={field}>
                <FormLabel htmlFor="email">{t('auth.signUp.email')}</FormLabel>
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
              onChange: zodFieldValidator(SignUpSchema.shape.password),
            }}
          >
            {(field) => (
              <FormField field={field}>
                <FormLabel htmlFor="password">{t('auth.signUp.password')}</FormLabel>
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
              <FormField field={field}>
                <FormLabel htmlFor="confirmPassword">{t('auth.signUp.confirmPassword')}</FormLabel>
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
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? t('auth.signUp.submitting') : t('auth.signUp.submit')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.signUp.hasAccount')}{' '}
            <Link to="/auth/signin" className="font-medium text-primary hover:underline">
              {t('auth.signUp.signIn')}
            </Link>
          </p>
        </CardFooter>
      </Form>
    </Card>
  );
}
