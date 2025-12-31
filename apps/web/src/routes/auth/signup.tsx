import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/lib/auth-client';
import { useFormValidation } from '@/lib/form-validation';
import { SignUpWithConfirmSchema, type SignUpWithConfirmInput } from '@khhub/shared';

export const Route = createFileRoute('/auth/signup')({
  component: SignUpPage,
});

function SignUpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const form = useFormValidation<SignUpWithConfirmInput>({
    schema: SignUpWithConfirmSchema,
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async (values) => {
      setServerError('');

      try {
        const result = await signUp.email({
          email: values.email,
          password: values.password,
          name: values.name,
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
      <form onSubmit={form.handleSubmit}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{t('auth.signUp.name')}</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...form.getFieldProps('name')}
              disabled={form.isSubmitting}
            />
            {form.touched.name && form.errors.name && (
              <p className="text-sm text-destructive">{form.errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.signUp.email')}</Label>
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
            <Label htmlFor="password">{t('auth.signUp.password')}</Label>
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.signUp.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...form.getFieldProps('confirmPassword')}
              disabled={form.isSubmitting}
            />
            {form.touched.confirmPassword && form.errors.confirmPassword && (
              <p className="text-sm text-destructive">{form.errors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={form.isSubmitting}>
            {form.isSubmitting ? t('auth.signUp.submitting') : t('auth.signUp.submit')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.signUp.hasAccount')}{' '}
            <Link to="/auth/signin" className="font-medium text-primary hover:underline">
              {t('auth.signUp.signIn')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
