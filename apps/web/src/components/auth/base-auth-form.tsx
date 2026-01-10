import { Form } from '@/components/ui/form';
import { AuthCard } from './auth-card';
import { AuthError } from './auth-error';
import { cn } from '@/lib/utils';
import React from 'react';

interface BaseAuthFormProps {
    readonly form: any;
    readonly title: string;
    readonly description: string;
    readonly footer: React.ReactNode;
    readonly children: React.ReactNode;
    readonly serverError?: string;
    readonly className?: string;
}

export function BaseAuthForm({
    form,
    title,
    description,
    footer,
    children,
    serverError,
    className,
}: BaseAuthFormProps) {
    return (
        <Form
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
            className={cn('w-full max-w-md', className)}
        >
            <AuthCard title={title} description={description} footer={footer}>
                <div className="space-y-4">
                    <AuthError error={serverError} />
                    {children}
                </div>
            </AuthCard>
        </Form>
    );
}
