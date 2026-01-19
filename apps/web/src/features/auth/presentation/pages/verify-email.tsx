import { useNavigate, createRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/infrastructure/ui/card';
import { Button } from '@/shared/infrastructure/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { verifyEmail } from '@/shared/infrastructure/lib/auth-client';
import { authRoute } from '../routing';

export const verifyEmailRoute = createRoute({
    getParentRoute: () => authRoute,
    path: '/verify-email',
    validateSearch: (search: Record<string, unknown>): { token: string; redirectTo: string } => {
        return {
            token: (search.token as string) || '',
            redirectTo: (search.redirectTo as string) || '/auth/signin',
        };
    },
    component: VerifyEmailPage,
});

function VerifyEmailPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const search = verifyEmailRoute.useSearch();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            if (!search.token) {
                setStatus('error');
                setErrorMessage(t('auth.verifyEmail.invalidLink.description'));
                return;
            }

            try {
                const result = await verifyEmail({ query: { token: search.token } });
                if (result.error) {
                    setStatus('error');
                    setErrorMessage(result.error.message || t('auth.verifyEmail.error.description'));
                    return;
                }
                setStatus('success');
            } catch {
                setStatus('error');
                setErrorMessage(t('auth.errors.genericError'));
            }
        };

        verify();
    }, [search.token, t]);

    if (status === 'loading') {
        return (
            <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{t('auth.verifyEmail.verifying.title')}</CardTitle>
                    <CardDescription>{t('auth.verifyEmail.verifying.description')}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (status === 'error') {
        return (
            <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                        <XCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{t('auth.verifyEmail.error.title')}</CardTitle>
                    <CardDescription>{errorMessage || t('auth.verifyEmail.error.description')}</CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col space-y-4">
                    <Button className="w-full" onClick={() => navigate({ to: '/auth/signin' })}>
                        {t('auth.verifyEmail.error.backToSignIn')}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-bold">{t('auth.verifyEmail.success.title')}</CardTitle>
                <CardDescription>{t('auth.verifyEmail.success.description')}</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button className="w-full" onClick={() => navigate({ to: search.redirectTo })}>
                    {t('auth.verifyEmail.success.continue')}
                </Button>
            </CardFooter>
        </Card>
    );
}
