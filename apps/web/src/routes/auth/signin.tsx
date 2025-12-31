import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth-client';

export const Route = createFileRoute('/auth/signin')({
  component: SignInPage,
});

function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(t('auth.errors.invalidCredentials'));
        return;
      }

      navigate({ to: '/app/dashboard' });
    } catch {
      setError(t('auth.errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t('auth.signIn.title')}</CardTitle>
        <CardDescription>{t('auth.signIn.description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.signIn.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
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
