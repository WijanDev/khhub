import { Link, createRoute } from '@tanstack/react-router';
import { authRoute } from '@/features/auth/presentation/routing';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Button } from '@/shared/infrastructure/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { zodFieldValidator, zodValidator } from '@/shared/infrastructure/lib/form-utils';
import { requestPasswordReset } from '@/shared/infrastructure/lib/auth-client';
import { AuthCard } from '@/features/auth/presentation/ui/auth-card';
import { AuthFormSubmit } from '@/features/auth/presentation/ui/auth-form-submit';
import { BaseAuthForm } from '@/features/auth/presentation/ui/base-auth-form';
import { BaseAuthField } from '@/features/auth/presentation/ui/base-auth-field';

export const forgotPasswordRoute = createRoute({
    getParentRoute: () => authRoute,
    path: '/forgot-password',
    component: ForgotPasswordPage,
});

// Simple schema for forgot password (just email)
const ForgotPasswordFormSchema = z.object({
    email: z.email('validation.email.invalid'),
});

function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const form = useForm({
        defaultValues: {
            email: '',
        },
        validators: {
            onSubmit: zodValidator(ForgotPasswordFormSchema),
        },
        onSubmit: async ({ value }) => {
            setServerError('');

            try {
                // Use Better Auth client
                const response = await requestPasswordReset({
                    email: value.email,
                });

                if (response.error) {
                    setServerError(response.error.message || t('auth.errors.genericError'));
                    return;
                }

                setSubmittedEmail(value.email);
                setSuccess(true);
            } catch {
                setServerError(t('auth.errors.genericError'));
            }
        },
    });

    if (success) {
        return (
            <AuthCard
                title={t('auth.forgotPassword.success.title')}
                description={
                    <>
                        {t('auth.forgotPassword.success.description')} <strong>{submittedEmail}</strong>
                    </>
                }
                footer={
                    <div className="flex flex-col space-y-4">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                setSuccess(false);
                                form.reset();
                            }}
                        >
                            {t('auth.forgotPassword.success.tryAnother')}
                        </Button>
                        <Link
                            to="/auth/signin"
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('auth.forgotPassword.backToSignIn')}
                        </Link>
                    </div>
                }
            >
                <div className="space-y-4 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('auth.forgotPassword.success.hint')}
                    </p>
                </div>
            </AuthCard>
        );
    }

    return (
        <BaseAuthForm
            form={form}
            title={t('auth.forgotPassword.title')}
            description={t('auth.forgotPassword.description')}
            serverError={serverError}
            footer={
                <>
                    <AuthFormSubmit
                        isSubmitting={form.state.isSubmitting}
                        labelKey="auth.forgotPassword.submit"
                        submittingLabelKey="auth.forgotPassword.submitting"
                    />
                    <Link
                        to="/auth/signin"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('auth.forgotPassword.backToSignIn')}
                    </Link>
                </>
            }
        >
            <BaseAuthField
                Field={form.Field}
                name="email"
                label={t('auth.forgotPassword.email')}
                type="email"
                placeholder="name@example.com"
                validator={zodFieldValidator(ForgotPasswordFormSchema.shape.email)}
                disabled={form.state.isSubmitting}
            />
        </BaseAuthForm>
    );
}
