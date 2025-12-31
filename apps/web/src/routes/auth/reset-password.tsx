import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useFormValidation, z } from '@/lib/form-validation';

// Schema for reset password with confirmation
const ResetPasswordFormSchema = z.object({
  newPassword: z.string().min(8, 'validation.password.minLength').max(128, 'validation.password.maxLength'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'validation.password.mismatch',
  path: ['confirmPassword'],
});
type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;

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

  const form = useFormValidation<ResetPasswordFormInput>({
    schema: ResetPasswordFormSchema,
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async (values) => {
      setServerError('');

      if (!token) {
        setServerError(t('auth.resetPassword.invalidLink.description'));
        return;
      }

      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            newPassword: values.newPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setServerError(data.error || t('auth.errors.genericError'));
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
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('auth.resetPassword.success.title')}</CardTitle>
          <CardDescription>
            {t('auth.resetPassword.success.description')}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => navigate({ to: '/auth/signin' })}>
            {t('auth.resetPassword.success.signIn')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t('auth.resetPassword.invalidLink.title')}</CardTitle>
          <CardDescription>
            {t('auth.resetPassword.invalidLink.description')}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4">
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
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t('auth.resetPassword.title')}</CardTitle>
        <CardDescription>{t('auth.resetPassword.description')}</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('auth.resetPassword.newPassword')}</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              {...form.getFieldProps('newPassword')}
              disabled={form.isSubmitting}
            />
            {form.touched.newPassword && form.errors.newPassword && (
              <p className="text-sm text-destructive">{form.errors.newPassword}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword')}</Label>
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
            {form.isSubmitting ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
          </Button>
          <Link
            to="/auth/signin"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('auth.resetPassword.backToSignIn')}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
