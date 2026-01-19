import { Link, createRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { signUp } from '@/shared/infrastructure/lib/auth-client';
import { SignUpSchema } from '@khhub/shared';
import { zodFieldValidator, zodValidator } from '@/shared/infrastructure/lib/form-utils';
import { EmailVerificationCard } from '@/shared/infrastructure/ui/email-verification-card';
import { AuthFormSubmit } from '@/features/auth/presentation/ui/auth-form-submit';
import { BaseAuthForm } from '@/features/auth/presentation/ui/base-auth-form';
import { BaseAuthField } from '@/features/auth/presentation/ui/base-auth-field';
import { ConfirmPasswordField } from '@/features/auth/presentation/ui/confirm-password-field';
import { authRoute } from '../routing';

export const signUpRoute = createRoute({
    getParentRoute: () => authRoute,
    path: '/signup',
    component: SignUpPage,
});

// Extended schema with password confirmation
const SignUpFormSchema = SignUpSchema.extend({
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'validation.password.mismatch',
    path: ['confirmPassword'],
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
        <BaseAuthForm
            form={form}
            title={t('auth.signUp.title')}
            description={t('auth.signUp.description')}
            serverError={serverError}
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
            <BaseAuthField
                Field={form.Field}
                name="name"
                label={t('auth.signUp.name')}
                placeholder="John Doe"
                validator={zodFieldValidator(SignUpSchema.shape.name)}
                disabled={form.state.isSubmitting}
            />

            <BaseAuthField
                Field={form.Field}
                name="email"
                label={t('auth.signUp.email')}
                type="email"
                placeholder="name@example.com"
                validator={zodFieldValidator(SignUpSchema.shape.email)}
                disabled={form.state.isSubmitting}
            />

            <BaseAuthField
                Field={form.Field}
                name="password"
                label={t('auth.signUp.password')}
                type="password"
                placeholder="••••••••"
                validator={zodFieldValidator(SignUpSchema.shape.password)}
                disabled={form.state.isSubmitting}
            />

            <ConfirmPasswordField
                Field={form.Field}
                passwordFieldName="password"
                label={t('auth.signUp.confirmPassword')}
                disabled={form.state.isSubmitting}
            />
        </BaseAuthForm>
    );
}
