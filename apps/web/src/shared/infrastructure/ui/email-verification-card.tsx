import { Button } from "@/shared/infrastructure/ui/button";
import { useState } from "react";
import { sendVerificationEmail } from "@/shared/infrastructure/lib/auth-client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/infrastructure/ui/card";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";


export const EmailVerificationCard = ({ userEmail }: { userEmail: string }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [serverError, setServerError] = useState('');
    const [resendingVerification, setResendingVerification] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const handleResendVerification = async () => {
        if (!userEmail) return;
        setResendingVerification(true);
        setResendSuccess(false);
        setServerError('');
        try {
            const response = await sendVerificationEmail({
                email: userEmail,
            });
            if (response.error) {
                setServerError(response.error.message || t('auth.emailVerification.resendError'));
                return;
            }
            setResendSuccess(true);
            setServerError('');
        } catch (error) {
            console.error('Error sending verification email:', error);
            setServerError(t('auth.emailVerification.resendError'));
        }
    };
    return (
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">{t('auth.signUp.success.title')}</CardTitle>
                <CardDescription>{t('auth.signUp.success.description', { email: userEmail })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-3">
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">
                        <p className="font-medium mb-2">{t('auth.signUp.success.verifyTitle')}</p>
                        <p>{t('auth.signUp.success.verifyDescription')}</p>
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
                {serverError && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        {serverError}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <Button className="w-full" onClick={() => navigate({ to: '/auth/signin' })}>
                    {t('auth.signUp.success.signIn')}
                </Button>
            </CardFooter>
        </Card>
    )
}
