import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth-client';
import { useFormValidation } from '@/lib/form-validation';
import { SignInSchema, type SignInInput } from '@khhub/shared';

export const Route = createFileRoute('/auth/signin')({
  component: SignInPage,
});

function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const form = useFormValidation<SignInInput>({
    schema: SignInSchema,
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async (values) => {
      setServerError('');

      try {
        const result = await signIn.email({
          email: values.email,
          password: values.password,
        });

        if (result.error) {
          setServerError(t('auth.errors.invalidCredentials'));
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
        <CardTitle className="text-2xl font-bold">{t('auth.signIn.title')}</CardTitle>
        <CardDescription>{t('auth.signIn.description')}</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.signIn.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...form.getFieldProps('email')}
              disabled={form.isSubmitting}
            />
            {form.touched.email && form.errors.email && (
              <p className="text-sm text-destructive">{form.errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('auth.signIn.password')}</Label>
              <Link
                to="/auth/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {t('auth.signIn.forgotPassword')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.getFieldProps('password')}
              disabled={form.isSubmitting}
            />
            {form.touched.password && form.errors.password && (
              <p className="text-sm text-destructive">{form.errors.password}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={form.isSubmitting}>
            {form.isSubmitting ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.signIn.noAccount')}{' '}
            <Link to="/auth/signup" className="font-medium text-primary hover:underline">
              {t('auth.signIn.createAccount')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
